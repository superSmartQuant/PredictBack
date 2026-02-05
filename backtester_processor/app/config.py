"""
Application configuration using Pydantic Settings.
"""

from decimal import Decimal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str
    default_fee_rate: Decimal = Decimal("0.001")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
