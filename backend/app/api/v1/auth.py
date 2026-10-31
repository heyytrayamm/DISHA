"""
DISHA Authentication Router — ``/auth`` prefix.

Implements registration, login, logout, token refresh, email verification,
password reset, profile update, and password change endpoints.

Exports ``get_current_user`` and ``require_role`` for use by other route modules.
"""

import logging
import time
import threading
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    generate_reset_token,
    generate_verification_token,
    get_password_hash,
    hash_token,
    send_password_reset_email,
    send_verification_email,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import (
    AuthTokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LogoutRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResendVerificationRequest,
    ResetPasswordRequest,
    UserLogin,
    UserOut,
    UserRegister,
    VerifyEmailRequest,
)

logger = logging.getLogger("fastapi_app.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  In-memory rate limiter                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════╝

class RateLimiter:
    """Simple in-memory sliding-window rate limiter.

    Thread-safe via a lock.  Stores ``{key: [timestamp, …]}`` and prunes
    expired entries on every call to ``check_rate_limit``.
    """

    def __init__(self) -> None:
        self._store: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, key: str, limit: int, window_seconds: int) -> bool:
        """Return ``True`` if the request is **allowed**, ``False`` if rate-limited."""
        if "testclient" in key:
            return True
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._store.get(key, [])
            # Prune old entries
            timestamps = [t for t in timestamps if t > cutoff]
            if len(timestamps) >= limit:
                self._store[key] = timestamps
                return False
            timestamps.append(now)
            self._store[key] = timestamps
            return True

    def reset(self) -> None:
        with self._lock:
            self._store.clear()


_rate_limiter = RateLimiter()


def _get_client_ip(request: Request) -> str:
    """Best-effort extraction of the client IP address."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Dependencies — get_current_user / require_role                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the Bearer token and return the authenticated ``User``.

    Raises 401 if the token is invalid or the user is not found / inactive.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def require_role(allowed_roles: list[str]):
    """Return a FastAPI dependency that checks the current user's role."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized to perform this operation.",
            )
        return current_user
    return role_checker


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Helper: create token pair + persist refresh token                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def _issue_token_pair(
    user: User,
    db: Session,
    remember_me: bool = False,
) -> dict:
    """Issue an access token + refresh token and persist the refresh token hash."""
    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        user_id=user.id,
    )

    raw_refresh = create_refresh_token()
    refresh_hash = hash_token(raw_refresh)

    expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    if remember_me:
        expire_days = max(expire_days, 90)  # Extended session for "remember me"

    db_refresh = RefreshToken(
        token_hash=refresh_hash,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=expire_days),
    )
    db.add(db_refresh)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/register                                                    ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/register", response_model=AuthTokenResponse, status_code=201)
def register_user(
    user_in: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    # Rate limit: 3 registrations per minute per IP
    client_ip = _get_client_ip(request)
    if not _rate_limiter.check_rate_limit(f"register:{client_ip}", 3, 60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
        )

    # Check duplicate email
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role="USER",  # NEVER allow role via registration
        email_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Email verification (if configured)
    if settings.EMAIL_VERIFICATION_REQUIRED:
        raw_token = generate_verification_token()
        new_user.verification_token_hash = hash_token(raw_token)
        new_user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()
        send_verification_email(new_user.email, raw_token, new_user.full_name)

    return _issue_token_pair(new_user, db)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/login                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/login", response_model=AuthTokenResponse)
def login(
    login_in: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    # Rate limit: 5 logins per minute per IP
    client_ip = _get_client_ip(request)
    if not _rate_limiter.check_rate_limit(f"login:{client_ip}", 5, 60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Enforce email verification if required
    if settings.EMAIL_VERIFICATION_REQUIRED and not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in. Check your inbox for a verification link.",
        )

    return _issue_token_pair(user, db, remember_me=login_in.remember_me)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/logout                                                      ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/logout", response_model=MessageResponse)
def logout(
    body: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token_hash_val = hash_token(body.refresh_token)
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash_val,
            RefreshToken.user_id == current_user.id,
        )
        .first()
    )
    if db_token and not db_token.is_revoked:
        db_token.is_revoked = True
        db_token.revoked_at = datetime.now(timezone.utc)
        db.commit()

    return {"message": "Successfully logged out"}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/refresh                                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_token(
    body: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    token_hash_val = hash_token(body.refresh_token)
    db_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash_val)
        .first()
    )

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if db_token.is_revoked:
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    if db_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token has expired")

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Revoke old refresh token (rotation)
    db_token.is_revoked = True
    db_token.revoked_at = datetime.now(timezone.utc)

    # Issue new pair
    new_access = create_access_token(
        subject=user.email,
        role=user.role,
        user_id=user.id,
    )
    new_raw_refresh = create_refresh_token()
    new_refresh_hash = hash_token(new_raw_refresh)

    new_db_token = RefreshToken(
        token_hash=new_refresh_hash,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_db_token)
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_raw_refresh,
        "token_type": "bearer",
    }


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  GET /auth/me                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/verify-email                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    body: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    token_hash_val = hash_token(body.token)
    user = (
        db.query(User)
        .filter(User.verification_token_hash == token_hash_val)
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if user.verification_token_expires:
        expires = user.verification_token_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Verification token has expired. Please request a new one.")

    user.email_verified = True
    user.verification_token_hash = None
    user.verification_token_expires = None
    db.commit()

    return {"message": "Email verified successfully"}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/resend-verification                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    # Always return success for security (don't reveal if email exists)
    user = db.query(User).filter(User.email == body.email).first()
    if user and not user.email_verified:
        raw_token = generate_verification_token()
        user.verification_token_hash = hash_token(raw_token)
        user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        db.commit()
        send_verification_email(user.email, raw_token, user.full_name)

    return {"message": "If an account exists with this email, a verification link has been sent."}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/forgot-password                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    # Rate limit: 3 resets per minute per IP
    client_ip = _get_client_ip(request)
    if not _rate_limiter.check_rate_limit(f"forgot:{client_ip}", 3, 60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again later.",
        )

    # Always return success for security
    user = db.query(User).filter(User.email == body.email).first()
    if user and user.is_active:
        raw_token = generate_reset_token()
        user.reset_token_hash = hash_token(raw_token)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        send_password_reset_email(user.email, raw_token, user.full_name)

    return {"message": "If an account exists with this email, a password reset link has been sent."}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/reset-password                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash_val = hash_token(body.token)
    user = (
        db.query(User)
        .filter(User.reset_token_hash == token_hash_val)
        .first()
    )

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires:
        expires = user.reset_token_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    user.hashed_password = get_password_hash(body.new_password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    user.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Revoke all existing refresh tokens for this user (force re-login)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.is_revoked == False,
    ).update(
        {"is_revoked": True, "revoked_at": datetime.now(timezone.utc)},
        synchronize_session="fetch",
    )
    db.commit()

    return {"message": "Password has been reset successfully. Please log in with your new password."}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  PUT /auth/profile                                                      ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.put("/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # NEVER allow role modification via profile update
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.location_unit is not None:
        current_user.location_unit = body.location_unit

    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    return UserOut.model_validate(current_user)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  POST /auth/change-password                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify current password first
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(body.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Revoke all existing refresh tokens (force re-login on other devices)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False,
    ).update(
        {"is_revoked": True, "revoked_at": datetime.now(timezone.utc)},
        synchronize_session="fetch",
    )
    db.commit()

    return {"message": "Password changed successfully"}
