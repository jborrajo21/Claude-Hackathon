"""Scraper configuration."""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

# Rate limiting
MIN_DELAY_SECONDS = 3.0
MAX_DELAY_SECONDS = 8.0

# Browser settings
HEADLESS = True
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# SpareRoom settings
SPAREROOM_BASE_URL = "https://www.spareroom.co.uk"
SPAREROOM_SEARCH_URL = f"{SPAREROOM_BASE_URL}/flatshare"

# Default search parameters for London student accommodation
DEFAULT_SEARCH_PARAMS = {
    "max_rent": 1200,  # Monthly max in GBP
    "per": "pcm",
    "search_type": "offered",
    "location_type": "area",
    "where": "London",
}

# Maximum pages to scrape per run
MAX_PAGES = 10

# Database
DATABASE_URL = "postgresql://localhost:5432/swipestay"
