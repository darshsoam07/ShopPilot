from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    RETURN_WINDOW_DAYS: int = 7
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    MEDIA_DIR: str = "media"
    MAX_IMAGE_UPLOAD_BYTES: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)


settings = Settings()
