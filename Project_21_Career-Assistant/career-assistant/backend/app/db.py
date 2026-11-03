import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from .config import settings


def uid():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def digest(value):
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    username: Mapped[str] = mapped_column(String(30), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=now)


class Session(Base):
    __tablename__ = 'sessions'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    csrf: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime]


class ResetToken(Base):
    __tablename__ = 'password_reset_tokens'
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    expires_at: Mapped[datetime]


class Record(Base):
    """Versioned domain records. Authoritative JSON is relationally tenant scoped."""
    __tablename__ = 'records'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    kind: Mapped[str] = mapped_column(String(40))
    key: Mapped[str] = mapped_column(String(200))
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)
    __table_args__ = (UniqueConstraint('user_id', 'kind', 'key'), Index('ix_record_tenant_kind', 'user_id', 'kind'))


class File(Base):
    __tablename__ = 'files'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    record_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    key: Mapped[str] = mapped_column(String(200), unique=True)
    category: Mapped[str] = mapped_column(String(24))
    sha: Mapped[str] = mapped_column(String(64))
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(default=now)
    expires_at: Mapped[datetime | None] = mapped_column(nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)


class Task(Base):
    __tablename__ = 'tasks'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    kind: Mapped[str] = mapped_column(String(30))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default='queued', index=True)
    result: Mapped[dict] = mapped_column(JSON, default=dict)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class RateLimit(Base):
    __tablename__ = 'rate_limits'
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    count: Mapped[int] = mapped_column(default=0)
    until: Mapped[datetime]


class SchemaVersion(Base):
    __tablename__ = 'schema_versions'
    version: Mapped[int] = mapped_column(primary_key=True)


def make_engine(url):
    if url.startswith('postgresql://'):
        url = 'postgresql+psycopg://' + url.removeprefix('postgresql://')
    engine = create_engine(url, connect_args={'check_same_thread': False} if url.startswith('sqlite') else {}, pool_pre_ping=True)
    if url.startswith('sqlite'):
        @event.listens_for(engine, 'connect')
        def sqlite_config(conn, _):
            conn.execute('PRAGMA foreign_keys=ON')
            conn.execute('PRAGMA journal_mode=WAL')
    return engine


settings.storage_dir.mkdir(parents=True, exist_ok=True)
engine = make_engine(settings.database_url)
DB = sessionmaker(engine, expire_on_commit=False)


def migrate(target=engine):
    Base.metadata.create_all(target)
    with sessionmaker(target)() as db:
        if not db.get(SchemaVersion, 1):
            db.add(SchemaVersion(version=1))
            db.commit()
        if not db.get(SchemaVersion, 2):
            for row in db.query(Record).filter_by(kind='preferences').all():
                row.data={**row.data,'design':'amber'}
            db.add(SchemaVersion(version=2))
            db.commit()


def records(db, user_id, kind):
    return db.query(Record).filter_by(user_id=user_id, kind=kind)


def get_record(db, user_id, kind, key):
    return records(db, user_id, kind).filter_by(key=key).first()


def put(db, user_id, kind, key, data):
    row = get_record(db, user_id, kind, key)
    if row:
        row.data = data
    else:
        row = Record(user_id=user_id, kind=kind, key=key, data=data)
        db.add(row)
    db.flush()
    return row


def audit(db, user_id, action, details=None):
    return put(db, user_id, 'audit', uid(), {'action': action, 'details': details or {}, 'at': now().isoformat()})
