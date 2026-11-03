"""Explicit, offline reset for the personal local launcher. Never run at startup."""
import argparse
import os
from pathlib import Path
import shutil
import socket
import sqlite3
import sys

from run_local import parse_dotenv

ROOT = Path(__file__).resolve().parents[1]


def linked(path):
    return path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction())


def validate_data_dir(path, root):
    path = path.absolute()
    # Check before resolving: junctions must never redirect recursive deletion.
    if any(linked(part) for part in (path, *path.parents)):
        raise ValueError('Data path contains a symbolic link or junction; reset refused.')
    path = path.resolve()
    root = root.resolve()
    protected = (root, root.parent, Path.home().resolve(), Path(path.anchor))
    if any(path == item or path in item.parents for item in protected):
        raise ValueError('Refusing to remove a project, home, drive root, or its ancestor.')
    if path.is_relative_to(root) and not path.is_relative_to(root / 'backend' / 'data'):
        raise ValueError('Inside the project, only backend/data may be recursively removed.')
    if path.exists():
        if not path.is_dir():
            raise ValueError('Data directory is not a directory.')
        if any((path / name).exists() for name in ('.git', 'pyproject.toml', 'package.json')):
            raise ValueError('Data directory looks like a source checkout; reset refused.')
        for folder, dirs, files in os.walk(path, followlinks=False):
            if any(linked(Path(folder) / name) for name in dirs + files):
                raise ValueError('Data directory contains a symbolic link or junction; reset refused.')
    return path


def plan(root, data_dir=None, for_sharing=False):
    env = parse_dotenv(root / '.env') if (root / '.env').exists() else {}
    configured = os.environ.get('CAREER_ASSISTANT_DATA_DIR') or env.get('CAREER_ASSISTANT_DATA_DIR')
    target = Path(data_dir or configured or root / 'backend' / 'data').expanduser()
    if not target.is_absolute():
        target = root / target
    if configured and data_dir is None and not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('Custom data directory is outside this project. Review it and explicitly pass --data-dir PATH.')
    targets = [validate_data_dir(target, root)]
    default = root / 'backend' / 'data'
    if targets[0] != default.resolve():
        targets.append(validate_data_dir(default, root))
    if for_sharing:
        for folder in (root, root / 'backend', root / 'frontend'):
            if any(linked(part) for part in (folder, *folder.parents)):
                raise ValueError('Configuration directory contains a symbolic link or junction; reset refused.')
            for candidate in sorted(folder.glob('.env*')):
                if candidate.name == '.env.example':
                    continue
                if linked(candidate) or candidate.is_dir():
                    raise ValueError('Unexpected linked or directory .env path; reset refused.')
                targets.append(candidate)
    return targets


def app_running():
    for port in (8000, 5173):
        with socket.socket() as connection:
            connection.settimeout(0.3)
            if connection.connect_ex(('127.0.0.1', port)) == 0:
                return True
    return False


def erase(targets, root):
    # Revalidate all recursive targets before making any changes.
    for path in targets:
        if path.is_dir():
            validate_data_dir(path, root)
        elif linked(path):
            raise ValueError('A reset target became a link; reset refused.')
    for path in targets:
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink(missing_ok=True)


def erase_keep_login(targets, root):
    """Clear local workspace data while retaining user identities and password hashes."""
    for path in targets:
        validate_data_dir(path, root)
        database = path / 'career.db'
        if database.exists():
            with sqlite3.connect(database) as connection:
                connection.execute('PRAGMA foreign_keys=ON')
                connection.execute('PRAGMA secure_delete=ON')
                tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
                if 'users' not in tables:
                    raise ValueError('Cannot preserve login: the database has no users table.')
                retained = connection.execute('SELECT * FROM users ORDER BY id').fetchall()
                for table in tables:
                    if table not in {'users', 'schema_versions'}:
                        connection.execute('DELETE FROM "' + table.replace('"','""') + '"')
                connection.commit()
                connection.execute('VACUUM')
                connection.execute('PRAGMA wal_checkpoint(TRUNCATE)')
                assert connection.execute('SELECT * FROM users ORDER BY id').fetchall() == retained
        if path.exists():
            for child in path.iterdir():
                if child.name in {'career.db','career.db-wal','career.db-shm'}:
                    continue
                if child.is_dir():
                    shutil.rmtree(child)
                else:
                    child.unlink()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='List targets without deleting anything.')
    parser.add_argument('--for-sharing', action='store_true', help='Also delete local .env configuration and API keys.')
    parser.add_argument('--data-dir', help='Explicit custom local launcher data directory.')
    parser.add_argument('--keep-login', action='store_true', help='Clear candidate data but preserve usernames, emails and password hashes; revoke sessions.')
    args = parser.parse_args(argv)
    try:
        if args.keep_login and args.for_sharing:
            raise ValueError('--keep-login cannot be combined with --for-sharing.')
        targets = plan(ROOT, args.data_dir, args.for_sharing)
        print('CAUTION: Permanently deletes '+('candidate data, sessions, resumes, profiles,' if args.keep_login else 'ALL local accounts, sessions, resumes, profiles,'))
        if args.keep_login:
            print('Login accounts and password hashes are preserved. You will need to sign in again.')
        print('jobs, interview guides, downloads, tasks, and RAG knowledge/embeddings.')
        if args.for_sharing:
            print('Also deletes .env configuration and API keys. .env.example is kept.')
        print('Targets:')
        for path in targets:
            print(f'  {path}')
        print('External PostgreSQL, Qdrant, S3, backups, and browser data are not reset.')
        if args.dry_run:
            print('Dry run: nothing deleted.')
            return 0
        if app_running():
            raise ValueError('Stop the app/worker first (Ctrl+C in its launcher). Ports 8000/5173 must be free.')
        if input('Type DELETE ALL DATA to continue: ').strip() != 'DELETE ALL DATA':
            print('Cancelled. Nothing deleted.')
            return 1
        if args.keep_login:
            erase_keep_login(targets, ROOT)
        else:
            erase(targets, ROOT)
        print('Local reset complete. '+('Sign in with your existing login.' if args.keep_login else 'Start the app and register a new account.'))
        return 0
    except (ValueError, OSError, EOFError, sqlite3.Error) as exc:
        print(f'Reset failed: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
