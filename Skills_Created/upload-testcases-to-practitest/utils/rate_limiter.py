"""
Rate Limiter for PractiTest API Calls
Prevents hitting API rate limits and implements backoff
"""

import time
import os
from datetime import datetime, timedelta
from typing import Optional, Callable, Any
from threading import Lock


class RateLimiter:
    """
    Rate limiter with exponential backoff
    Prevents API rate limit violations
    """

    def __init__(
        self,
        max_calls_per_second: float = None,
        max_concurrent: int = None,
        initial_backoff: float = 1.0,
        max_backoff: float = 60.0,
        backoff_multiplier: float = 2.0
    ):
        """
        Initialize rate limiter

        Args:
            max_calls_per_second: Maximum API calls per second (configurable via env var)
            max_concurrent: Maximum concurrent calls (configurable via env var)
            initial_backoff: Initial backoff delay in seconds
            max_backoff: Maximum backoff delay in seconds
            backoff_multiplier: Multiplier for exponential backoff
        """
        # Get from environment or use defaults
        self.max_calls_per_second = max_calls_per_second or float(
            os.getenv('PT_MAX_CALLS_PER_SECOND', '2')
        )
        self.max_concurrent = max_concurrent or int(
            os.getenv('PT_MAX_CONCURRENT', '5')
        )

        self.initial_backoff = initial_backoff
        self.max_backoff = max_backoff
        self.backoff_multiplier = backoff_multiplier

        # State
        self.last_call_time = None
        self.current_backoff = initial_backoff
        self.consecutive_failures = 0
        self.lock = Lock()

        # Calculate minimum delay between calls
        self.min_delay = 1.0 / self.max_calls_per_second if self.max_calls_per_second > 0 else 0

    def acquire(self) -> float:
        """
        Acquire permission to make an API call
        Returns the time waited (for metrics)
        """
        with self.lock:
            now = time.time()
            wait_time = 0

            if self.last_call_time is not None:
                elapsed = now - self.last_call_time
                required_delay = max(self.min_delay, self.current_backoff)

                if elapsed < required_delay:
                    wait_time = required_delay - elapsed
                    time.sleep(wait_time)
                    now = time.time()

            self.last_call_time = now
            return wait_time

    def release_success(self):
        """
        Mark successful API call
        Resets backoff
        """
        with self.lock:
            self.current_backoff = self.initial_backoff
            self.consecutive_failures = 0

    def release_failure(self, is_rate_limit: bool = False):
        """
        Mark failed API call
        Increases backoff

        Args:
            is_rate_limit: Whether failure was due to rate limiting (429 response)
        """
        with self.lock:
            self.consecutive_failures += 1

            # Exponential backoff
            self.current_backoff = min(
                self.current_backoff * self.backoff_multiplier,
                self.max_backoff
            )

            # If rate limit hit, use more aggressive backoff
            if is_rate_limit:
                self.current_backoff = min(
                    self.current_backoff * 2,
                    self.max_backoff
                )

    def execute_with_rate_limit(
        self,
        func: Callable,
        *args,
        max_retries: int = 3,
        **kwargs
    ) -> Any:
        """
        Execute a function with rate limiting and retry logic

        Args:
            func: Function to execute
            *args: Positional arguments for function
            max_retries: Maximum number of retries
            **kwargs: Keyword arguments for function

        Returns:
            Result of function call

        Raises:
            Exception: If all retries exhausted
        """
        last_exception = None

        for attempt in range(max_retries + 1):
            # Wait for rate limit clearance
            wait_time = self.acquire()

            try:
                result = func(*args, **kwargs)
                self.release_success()
                return result

            except Exception as e:
                last_exception = e

                # Check if it's a rate limit error
                is_rate_limit = self._is_rate_limit_error(e)

                self.release_failure(is_rate_limit=is_rate_limit)

                # Don't retry on last attempt
                if attempt >= max_retries:
                    break

                # Log retry
                print(f"Retry {attempt + 1}/{max_retries} after {self.current_backoff:.1f}s backoff")

                # Wait before retry
                time.sleep(self.current_backoff)

        # All retries exhausted
        raise last_exception

    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Check if error is due to rate limiting"""
        error_str = str(error).lower()
        return any(indicator in error_str for indicator in [
            'rate limit',
            'too many requests',
            '429',
            'throttle'
        ])

    def get_stats(self) -> dict:
        """Get rate limiter statistics"""
        return {
            "max_calls_per_second": self.max_calls_per_second,
            "max_concurrent": self.max_concurrent,
            "current_backoff": self.current_backoff,
            "consecutive_failures": self.consecutive_failures,
            "min_delay": self.min_delay
        }

    def reset(self):
        """Reset rate limiter state"""
        with self.lock:
            self.current_backoff = self.initial_backoff
            self.consecutive_failures = 0
            self.last_call_time = None
