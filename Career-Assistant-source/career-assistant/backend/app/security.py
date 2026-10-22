import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import case, delete

from .config import settings
from .db import DB, RateLimit, Session, User, digest, now

hasher = PasswordHasher()
DUMMY_HASH = hasher.hash('a dummy password that cannot authenticate')


def database():
    with DB() as db:
        yield db


def password_ok(value):
    if not 8 <= len(value) <= 1024:
        raise HTTPException(422, 'Password must contain 8–1024 characters.')


def verify(hashed, password):
    try:
        return hasher.verify(hashed, password)
    except (VerificationError, ValueError):
        return False


def rate_limit(db, request, scope, identity='', limit=10):
    # Persistent limits survive restarts. Production proxy must provide trusted client IP.
    ip = request.client.host if request.client else 'unknown'
    keys = [digest(f'{scope}:ip:{ip}')]
    if identity:
        keys.append(digest(f'{scope}:account:{identity.lower()}'))
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    insert=sqlite_insert if db.bind.dialect.name=='sqlite' else pg_insert
    counts=[]
    stamp=now()
    for key in keys:
        expired=RateLimit.until<=stamp
        stmt=insert(RateLimit).values(key=key,count=1,until=stamp+timedelta(minutes=15))
        stmt=stmt.on_conflict_do_update(index_elements=[RateLimit.key],set_={
            'count':case((expired,1),else_=RateLimit.count+1),
            'until':case((expired,stamp+timedelta(minutes=15)),else_=RateLimit.until)}).returning(RateLimit.count)
        counts.append(db.execute(stmt).scalar_one())
    db.commit()
    if any(count>limit for count in counts):
        raise HTTPException(429, 'Too many attempts. Try again in 15 minutes.')


def current(request: Request, db=Depends(database)):
    raw = request.cookies.get('career_session', '')
    session = db.get(Session, digest(raw))
    if not session or session.expires_at <= now():
        raise HTTPException(401, 'Please log in.')
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        token = request.headers.get('X-CSRF-Token', '')
        if not secrets.compare_digest(token, session.csrf):
            raise HTTPException(403, 'Invalid CSRF token. Refresh and try again.')
    request.state.session = session
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, 'Please log in.')
    return user


def invalidate(db, user_id):
    db.execute(delete(Session).where(Session.user_id == user_id))
