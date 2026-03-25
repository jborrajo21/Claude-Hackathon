"""Rate limiting utilities."""

import asyncio
import random

from scraper.config import MAX_DELAY_SECONDS, MIN_DELAY_SECONDS


async def rate_limit_delay(
    min_seconds: float = MIN_DELAY_SECONDS,
    max_seconds: float = MAX_DELAY_SECONDS,
) -> None:
    """Sleep for a random duration between min and max seconds."""
    delay = random.uniform(min_seconds, max_seconds)
    await asyncio.sleep(delay)
