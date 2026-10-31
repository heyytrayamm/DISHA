"""
Pydantic schemas for the DISHA authentication system.

Includes request/response models for registration, login, token refresh,
password reset, email verification, profile updates, and backward-compatible
schemas used by other parts of the codebase.
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    confirm_password: str
    accept_terms: bool = False

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Full name must be between 2 and 100 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("accept_terms")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the terms and conditions")
        return v


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


# ---------------------------------------------------------------------------
# User output
# ---------------------------------------------------------------------------

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    location_unit: Optional[str] = None
    is_active: bool
    email_verified: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Auth token responses
# ---------------------------------------------------------------------------

class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


# ---------------------------------------------------------------------------
# Profile update
# ---------------------------------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    location_unit: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 100:
                raise ValueError("Full name must be between 2 and 100 characters")
        return v


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


# ---------------------------------------------------------------------------
# Backward-compatible schemas (used by other parts of the codebase)
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "USER"
    location_unit: Optional[str] = "Delhi Zone"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class MessageResponse(BaseModel):
    message: str
