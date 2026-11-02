import logging
import time
from threading import Event
from concurrent.futures import ThreadPoolExecutor

from .config import settings
from .db import DB, migrate
from .storage import cleanup
from .workflows import run_one, WORKER_COUNT


def run(stop_event=None):
    stop_event = stop_event or Event()
    last_cleanup = 0
    pending = set()
    with ThreadPoolExecutor(max_workers=WORKER_COUNT, thread_name_prefix='career-task') as pool:
        while not stop_event.is_set():
            try:
                for future in list(pending):
                    if future.done():
                        pending.remove(future)
                        future.result()
                if time.monotonic()-last_cleanup > 60:
                    with DB() as db:
                        cleanup(db)
                    last_cleanup=time.monotonic()
                while len(pending) < WORKER_COUNT:
                    pending.add(pool.submit(run_one))
                stop_event.wait(0.5)
            except Exception:
                logging.exception('Worker operation failed')
                stop_event.wait(2)


def main():
    settings.validate()
    migrate()
    run()


if __name__=='__main__':
    main()
