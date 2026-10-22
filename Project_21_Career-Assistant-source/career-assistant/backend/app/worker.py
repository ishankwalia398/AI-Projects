import logging
import time
from threading import Event

from .config import settings
from .db import DB, migrate
from .storage import cleanup
from .workflows import run_one


def run(stop_event=None):
    last_cleanup=0
    while stop_event is None or not stop_event.is_set():
        try:
            if time.monotonic()-last_cleanup>60:
                with DB() as db:
                    cleanup(db)
                last_cleanup=time.monotonic()
            if not run_one():
                if stop_event is None:
                    time.sleep(2)
                else:
                    stop_event.wait(2)
        except Exception:
            logging.exception('Worker operation failed')
            if stop_event is None:
                time.sleep(5)
            else:
                stop_event.wait(5)


def main():
    settings.validate()
    migrate()
    run()


if __name__=='__main__':
    main()
