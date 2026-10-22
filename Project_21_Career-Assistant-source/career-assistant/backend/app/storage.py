import io
import zipfile
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import delete
from datetime import timedelta

from .config import settings
from .db import File, RateLimit, digest, now, uid


def s3():
    import boto3
    return boto3.client('s3', endpoint_url=settings.s3_endpoint or None)


def write_bytes(key, blob):
    if settings.s3_bucket:
        options = {'Bucket':settings.s3_bucket,'Key':key,'Body':blob}
        if not settings.s3_endpoint:
            options['ServerSideEncryption']='AES256'
        s3().put_object(**options)
    else:
        path = settings.storage_dir / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(blob)


def read_bytes(key):
    if settings.s3_bucket:
        return s3().get_object(Bucket=settings.s3_bucket, Key=key)['Body'].read()
    return (settings.storage_dir / key).read_bytes()


def remove_bytes(key):
    if settings.s3_bucket:
        s3().delete_object(Bucket=settings.s3_bucket, Key=key)
    else:
        (settings.storage_dir / key).unlink(missing_ok=True)


def store(db, user_id, name, blob, category, record_id=None, expires_at=None):
    file_id = uid()
    name = Path(name.replace('\\', '/')).name[:200]
    key = f'{user_id}/{category}/{file_id}'
    write_bytes(key, blob)
    row = File(id=file_id, user_id=user_id, name=name, key=key, category=category,
               sha=digest(blob), size=len(blob), record_id=record_id, expires_at=expires_at)
    db.add(row)
    db.flush()
    return row


def validate_upload(name, blob):
    ext = Path(name or '').suffix.lower()
    if ext not in ('.pdf', '.docx') or not blob or len(blob) > settings.max_upload:
        raise HTTPException(422, 'Choose a non-empty PDF or DOCX up to 10 MB.')
    if ext == '.pdf' and not blob.startswith(b'%PDF-'):
        raise HTTPException(422, 'File signature does not match PDF.')
    if ext == '.docx':
        try:
            with zipfile.ZipFile(io.BytesIO(blob)) as z:
                if 'word/document.xml' not in z.namelist() or len(z.infolist()) > 2000:
                    raise ValueError()
                if sum(x.file_size for x in z.infolist()) > 30 * 1024 * 1024:
                    raise ValueError()
                if any(x.endswith(('vbaProject.bin', '.exe')) for x in z.namelist()):
                    raise ValueError()
        except (ValueError, zipfile.BadZipFile):
            raise HTTPException(422, 'Invalid or oversized DOCX archive.')


def cleanup(db, at=None):
    at = at or now()
    removed = 0
    for row in db.query(File).filter(File.category == 'temporary', File.deleted == False, File.expires_at <= at).all():
        remove_bytes(row.key)
        row.deleted = True
        removed += 1
    # Only temporary keys without metadata can be orphans. Originals are never swept.
    if not settings.s3_bucket:
        known = {f.key for f in db.query(File).all()}
        for path in settings.storage_dir.glob('*/temporary/*'):
            key = path.relative_to(settings.storage_dir).as_posix()
            if key not in known and path.stat().st_mtime < at.timestamp() - 86400:
                path.unlink()
                removed += 1
    db.execute(delete(File).where(File.category=='temporary',File.deleted==True,File.expires_at<at-timedelta(days=30)))
    db.execute(delete(RateLimit).where(RateLimit.until<at-timedelta(days=1)))
    db.commit()
    return removed
