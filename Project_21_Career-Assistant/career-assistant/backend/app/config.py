import os
from dataclasses import dataclass
from pathlib import Path


DEFAULT_GREENHOUSE_BOARDS = 'canonical,cloudflare,stripe,datadog'
# Public employer ATS boards checked on every discovery run in addition to the
# configured boards. Each has active India and/or international engineering hiring.
EXTRA_GREENHOUSE_BOARDS = 'purestorage,fivetran,highradius,netskope,hackerrank,sumologic,zscaler,celonis,databricks,gitlab,coinbase,okta,toast,agoda,druva,airbnb,adyen,newrelic,lyft,pinterest,affirm,reddit,figma,thoughtworks,verkada,samsara,hellofresh'
EXTRA_LEVER_SITES = 'mindtickle,spotify,binance'
SMARTRECRUITERS_COMPANIES = 'BoschGroup,ServiceNow,Experian,Endava,Continental,Visa,Infosys,Wipro'
DOMESTIC_JOB_LIMIT = 10
VISA_JOB_LIMIT = 10
GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'

def _load_dotenv():
    """Load key-value pairs from .env if present and not already in environment."""
    for candidate in [
        Path.cwd() / '.env',
        Path.cwd().parent / '.env',
        Path(__file__).resolve().parent.parent / '.env',
        Path(__file__).resolve().parent.parent.parent / '.env',
    ]:
        if candidate.is_file():
            try:
                for line in candidate.read_text(encoding='utf-8').splitlines():
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('\'"')
                        if k and k not in os.environ:
                            os.environ[k] = v
                break
            except Exception:
                pass


_load_dotenv()


@dataclass
class Settings:
    mode: str = os.getenv('APP_ENV', 'development')
    database_url: str = os.getenv('DATABASE_URL', 'sqlite:///./data/career.db')
    frontend_url: str = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5173')
    storage_dir: Path = Path(os.getenv('STORAGE_DIR', './data/files'))
    cookie_secure: bool = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
    inline_worker: bool = os.getenv('INLINE_WORKER', 'true').lower() == 'true'
    session_hours: int = int(os.getenv('SESSION_HOURS', '24'))
    max_upload: int = 10 * 1024 * 1024
    llm_key: str = os.getenv('LLM_API_KEY', '')
    llm_url: str = os.getenv('LLM_BASE_URL', GEMINI_BASE_URL)
    llm_model: str = os.getenv('LLM_MODEL', 'gemini-3.8-flash')
    fallback_key: str = os.getenv('FALLBACK_API_KEY', '')
    fallback_url: str = os.getenv('FALLBACK_BASE_URL', os.getenv('LLM_BASE_URL', GEMINI_BASE_URL))
    fallback_model: str = os.getenv('FALLBACK_MODEL', 'gemini-3.5-flash-lite')
    openrouter_key: str = os.getenv('OPEN_ROUTER_API_KEY', '') or os.getenv('OPENROUTER_API_KEY', '')
    openrouter_model: str = os.getenv('OPEN_ROUTER_MODEL', 'mistralai/mistral-small-3.2-24b-instruct')
    openrouter_url: str = 'https://openrouter.ai/api/v1'
    # Extra models tried in order after the primary ones. Each entry is a model id;
    # a model that is out of quota or failing is skipped until its cooldown ends.
    gemini_models: str = os.getenv('GEMINI_MODELS', 'gemini-3.6-flash,gemini-3.5-flash,gemini-3-flash-preview,gemini-3.1-flash-lite,gemini-flash-lite-latest')
    # Free OpenRouter models. Requests keep data_collection=deny because they carry resume text,
    # so only free models with a no-training provider are listed; openrouter/free picks one automatically.
    openrouter_models: str = os.getenv('OPEN_ROUTER_MODELS', 'dots-studio/dots-3-note-preview:free,google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,openrouter/free')
    # Wait for the soonest cooling-down model instead of failing a feature outright.
    llm_max_wait: float = float(os.getenv('LLM_MAX_WAIT_SECONDS', '90'))
    # Last-resort provider when Gemini and OpenRouter are out of quota.
    anthropic_key: str = os.getenv('ANTHROPIC_API_KEY', '')
    anthropic_url: str = os.getenv('ANTHROPIC_BASE_URL', '')
    anthropic_model: str = os.getenv('ANTHROPIC_FALLBACK_MODEL', 'claude-sub-opus[1m]')
    anthropic_timeout: float = float(os.getenv('ANTHROPIC_TIMEOUT_SECONDS', '600'))
    llm_max_tokens: int = int(os.getenv('LLM_MAX_OUTPUT_TOKENS', '12000'))
    extraction_max_tokens: int = int(os.getenv('EXTRACTION_MAX_OUTPUT_TOKENS', '4096'))
    llm_reasoning_effort: str = os.getenv('LLM_REASONING_EFFORT', 'low')
    llm_timeout: float = float(os.getenv('LLM_REQUEST_TIMEOUT_SECONDS', '30'))
    llm_failure_cooldown: float = float(os.getenv('LLM_FAILURE_COOLDOWN_SECONDS', '300'))
    embedding_model: str = os.getenv('EMBEDDING_MODEL', 'gemini-embedding-001')
    qdrant_url: str = os.getenv('QDRANT_URL', '')
    qdrant_key: str = os.getenv('QDRANT_API_KEY', '')
    smtp_host: str = os.getenv('SMTP_HOST', '')
    smtp_port: int = int(os.getenv('SMTP_PORT', '587'))
    smtp_user: str = os.getenv('SMTP_USER', '')
    smtp_password: str = os.getenv('SMTP_PASSWORD', '')
    mail_from: str = os.getenv('MAIL_FROM', 'career@example.invalid')
    greenhouse_boards: str = os.getenv('GREENHOUSE_BOARDS', DEFAULT_GREENHOUSE_BOARDS)
    lever_sites: str = os.getenv('LEVER_SITES', '')
    extra_job_sources: bool = os.getenv('EXTRA_JOB_SOURCES', 'true').lower() == 'true'
    greenhouse_submission_keys: str = os.getenv('GREENHOUSE_SUBMISSION_KEYS', '{}')
    s3_bucket: str = os.getenv('S3_BUCKET', '')
    s3_endpoint: str = os.getenv('S3_ENDPOINT_URL', '')
    s3_access_key_id: str = os.getenv('AWS_ACCESS_KEY_ID', '')
    s3_secret_access_key: str = os.getenv('AWS_SECRET_ACCESS_KEY', '')

    def validate(self):
        if self.mode == 'production':
            if not self.database_url.startswith('postgresql'):
                raise RuntimeError('Production requires PostgreSQL.')
            if not self.cookie_secure or not self.frontend_url.startswith('https://'):
                raise RuntimeError('Production requires HTTPS and secure cookies.')
            if not self.s3_bucket or not self.s3_endpoint.startswith('https://'):
                raise RuntimeError('Production requires a private HTTPS S3-compatible object store.')
            if not self.s3_access_key_id or not self.s3_secret_access_key:
                raise RuntimeError('Production object storage credentials are not configured.')


settings = Settings()
