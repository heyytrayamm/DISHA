"""
Security utilities for DISHA authentication system.

Handles password hashing (argon2id primary with bcrypt legacy support), JWT access tokens,
refresh tokens, verification/reset tokens, and email sending.
"""

import hashlib
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger("fastapi_app.security")

# ---------------------------------------------------------------------------
# Password hashing — Argon2id (if argon2_cffi installed) with bcrypt support
# ---------------------------------------------------------------------------
try:
    # pyrefly: ignore[missing-import]
    from argon2 import PasswordHasher
    # pyrefly: ignore[missing-import]
    from argon2.exceptions import VerifyMismatchError
    _argon2_hasher: Optional[PasswordHasher] = PasswordHasher()
except Exception:
    _argon2_hasher = None


def get_password_hash(password: str) -> str:
    """Hash password with Argon2id if available, otherwise secure bcrypt."""
    if _argon2_hasher is not None:
        try:
            return _argon2_hasher.hash(password)
        except Exception as e:
            logger.warning(f"Argon2 hashing fallback to bcrypt: {e}")

    # Fallback to bcrypt with safe 72-byte boundary
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain_password against hashed_password.

    Supports Argon2id ($argon2...) and bcrypt ($2a$, $2b$...) transparently.
    """
    if hashed_password.startswith("$argon2"):
        if _argon2_hasher is not None:
            try:
                return _argon2_hasher.verify(hashed_password, plain_password)
            except Exception:
                return False
        return False

    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT access tokens
# ---------------------------------------------------------------------------

def create_access_token(
    subject: str | Any,
    role: str,
    user_id: str = "",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token.

    Payload includes ``sub`` (email), ``role``, ``user_id``, ``exp``, and ``type``.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {
        "sub": str(subject),
        "role": role,
        "user_id": user_id,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token. Returns the payload dict or ``None``."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Refresh tokens (opaque, stored hashed)
# ---------------------------------------------------------------------------

def create_refresh_token() -> str:
    """Return a cryptographically random 64-character hex string."""
    return secrets.token_hex(32)  # 32 bytes → 64 hex chars


def hash_token(token: str) -> str:
    """Return a SHA-256 hex digest of *token* for safe DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Verification & password-reset tokens
# ---------------------------------------------------------------------------

def generate_verification_token() -> str:
    """Return a URL-safe 32-byte token for email verification."""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Return a URL-safe 32-byte token for password reset."""
    return secrets.token_urlsafe(32)


# ---------------------------------------------------------------------------
# Email sending helpers (SMTP or log fallback)
# ---------------------------------------------------------------------------

def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns ``True`` on success.

    If SMTP is not configured (``SMTP_HOST`` is ``None`` or empty), the email
    content is logged to the console and ``False`` is returned.

    Never raises — all errors are caught and logged.
    """
    if not settings.SMTP_HOST:
        logger.info(
            "SMTP not configured — email NOT sent.\n"
            "  To: %s\n  Subject: %s\n  Body (HTML):\n%s",
            to_email,
            subject,
            html_body,
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.SMTP_USE_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        logger.info("Email sent to %s — subject: %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_verification_email(email: str, token: str, full_name: str) -> bool:
    """Send an email-verification link. Returns ``True`` if the email was sent."""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify your email — DISHA"
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Email Verification</h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>Thank you for registering with DISHA. Please verify your email address
        by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}"
               style="background-color: #1a56db; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
            </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #555;">{verification_url}</p>
        <p>This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
            If you did not create an account, please ignore this email.
        </p>
    </body>
    </html>
    """
    return _send_email(email, subject, html_body)


def send_password_reset_email(email: str, token: str, full_name: str) -> bool:
    """Send a password-reset link. Returns ``True`` if the email was sent."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Password Reset — DISHA"
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Password Reset</h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below
        to set a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}"
               style="background-color: #1a56db; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
            </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #555;">{reset_url}</p>
        <p>This link expires in 1 hour. If you did not request a password reset,
        you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">
            — DISHA Security Team
        </p>
    </body>
    </html>
    """
    return _send_email(email, subject, html_body)
