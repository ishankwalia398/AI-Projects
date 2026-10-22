import os
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Settings:
    mode: str = os.getenv('APP_ENV', 'development')
    database_url: str = os.getenv('DATABASE_URL', 'sqlite:///./data/career.db')
    frontend_url: str = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5173')
    storage_dir: Path = Path(os.getenv('STORAGE_DIR', './data/files'))
    cookie_secure: bool = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
    session_hours: int = int(os.getenv('SESSION_HOURS', '24'))
    max_upload: int = 10 * 1024 * 1024
    llm_key: str = os.getenv('LLM_API_KEY', '')
    llm_url: str = os.getenv('LLM_BASE_URL', 'https://api.openai.com/v1')
    llm_model: str = os.getenv('LLM_MODEL', 'gpt-5.1')
    fallback_key: str = os.getenv('FALLBACK_API_KEY', '')
    fallback_url: str = os.getenv('FALLBACK_BASE_URL', 'https://api.openai.com/v1')
    fallback_model: str = os.getenv('FALLBACK_MODEL', 'gpt-4.1')
    embedding_model: str = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
    qdrant_url: str = os.getenv('QDRANT_URL', '')
    qdrant_key: str = os.getenv('QDRANT_API_KEY', '')
    smtp_host: str = os.getenv('SMTP_HOST', '')
    smtp_port: int = int(os.getenv('SMTP_PORT', '587'))
    smtp_user: str = os.getenv('SMTP_USER', '')
    smtp_password: str = os.getenv('SMTP_PASSWORD', '')
    mail_from: str = os.getenv('MAIL_FROM', 'career@example.invalid')
    greenhouse_boards: str = os.getenv('GREENHOUSE_BOARDS', '')
    lever_sites: str = os.getenv('LEVER_SITES', '')
    greenhouse_submission_keys: str = os.getenv('GREENHOUSE_SUBMISSION_KEYS', '{}')
    s3_bucket: str = os.getenv('S3_BUCKET', '')
    s3_endpoint: str = os.getenv('S3_ENDPOINT_URL', '')

    def validate(self):
        if self.mode == 'production':
            if not self.database_url.startswith('postgresql'):
                raise RuntimeError('Production requires PostgreSQL.')
            if not self.cookie_secure or not self.frontend_url.startswith('https://'):
                raise RuntimeError('Production requires HTTPS and secure cookies.')


settings = Settings()
