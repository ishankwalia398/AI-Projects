"""Serialize answer admission, logout and final writes across backend processes."""
from sqlalchemy import update
from .db import User


def lock_user(db, user_id):
    # A no-op UPDATE obtains a real write lock on SQLite and a row lock on PostgreSQL.
    # Hold only during short database changes, never during a provider request.
    db.execute(update(User).where(User.id == user_id).values(username=User.username))
