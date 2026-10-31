import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Label Compliance Checking System"
    VERSION: str = "2026.1.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-sih2026-compliance-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes (was 7 days)

    # Refresh Token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Server & Networking
    PORT: int = int(os.getenv("PORT", "8080"))
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    TESSERACT_CMD: Optional[str] = os.getenv("TESSERACT_CMD", None)

    # Database: Supports PostgreSQL or SQLite fallback
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./label_compliance.db"
    )

    # AWS S3 (Optional - uses local file storage fallback if not configured)
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    S3_BUCKET_NAME: Optional[str] = os.getenv("S3_BUCKET_NAME", None)

    # Ox Alpha AI Integration (OpenAI-compatible)
    OX_ALPHA_API_KEY: Optional[str] = os.getenv("OX_ALPHA_API_KEY", None)
    OX_ALPHA_BASE_URL: str = os.getenv("OX_ALPHA_BASE_URL", "https://oxalpha.run/api/v1")
    OX_ALPHA_MODEL: str = os.getenv("OX_ALPHA_MODEL", "ox-alpha")

    # Storage paths for local fallback
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")
    REPORT_DIR: str = os.path.join(os.getcwd(), "reports")

    # Email / SMTP (optional — graceful degradation if not configured)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@disha.gov.in")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "DISHA - Digital Inspection & Standards Hub")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    EMAIL_VERIFICATION_REQUIRED: bool = os.getenv("EMAIL_VERIFICATION_REQUIRED", "false").lower() == "true"

    # Frontend URL (for email links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_PASSWORD_RESET: str = "3/minute"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()

# Ensure local storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
