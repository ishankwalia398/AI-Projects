import logging
import time

from .config import settings
from .db import DB, migrate
from .storage import cleanup
from .workflows import run_one


def main():
    settings.validate()
    migrate()
    last_cleanup=0
    while True:
        try:
            if time.monotonic()-last_cleanup>60:
                with DB() as db:
                    cleanup(db)
                last_cleanup=time.monotonic()
            if not run_one():
                time.sleep(2)
        except Exception:
            logging.exception('Worker operation failed')
            time.sleep(5)


if __name__=='__main__':
    main()
