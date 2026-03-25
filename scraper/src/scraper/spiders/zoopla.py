"""Zoopla spider — scrapes London rental listings."""

import logging
from typing import AsyncIterator
from urllib.parse import urlencode

from playwright.async_api import Page

from scraper.config import MAX_PAGES, ZOOPLA_BASE_URL, ZOOPLA_SEARCH_URL
from scraper.models import Listing
from scraper.parsers.zoopla import parse_listings_from_next_data
from scraper.spiders.base import BaseSpider

logger = logging.getLogger(__name__)


class ZooplaSpider(BaseSpider):
    """Spider for zoopla.co.uk — UK's largest property portal."""

    name = "zoopla"

    def __init__(
        self,
        max_rent: int = 1500,
        max_pages: int = MAX_PAGES,
        headless: bool = True,
    ):
        super().__init__(max_pages=max_pages, headless=headless)
        self.max_rent = max_rent

    def _build_search_url(self, page_num: int = 1) -> str:
        params = {
            "price_max": self.max_rent,
            "price_frequency": "per_month",
            "results_per_page": 25,
            "pn": page_num,
        }
        return f"{ZOOPLA_SEARCH_URL}?{urlencode(params)}"

    async def _scrape(self, page: Page) -> AsyncIterator[Listing]:
        for page_num in range(1, self.max_pages + 1):
            url = self._build_search_url(page_num)
            logger.info("[%s] Fetching page %d: %s", self.name, page_num, url)

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=40000)
                await self._dismiss_cookies(page)
                await page.wait_for_timeout(3000)
            except Exception as e:
                logger.error("[%s] Failed to load page %d: %s", self.name, page_num, e)
                break

            html = await page.content()
            listings = parse_listings_from_next_data(html, base_url=ZOOPLA_BASE_URL)

            if not listings:
                logger.info("[%s] No listings on page %d, stopping.", self.name, page_num)
                break

            logger.info("[%s] Parsed %d listings on page %d", self.name, len(listings), page_num)
            for listing in listings:
                yield listing

            await self.delay()

    async def _dismiss_cookies(self, page: Page) -> None:
        selectors = [
            "button[id*='accept']",
            "button[class*='accept']",
            "button:has-text('Accept all')",
            "button:has-text('Accept')",
            "button:has-text('Got it')",
            "[data-testid='accept-all']",
            "#onetrust-accept-btn-handler",
        ]
        for selector in selectors:
            try:
                btn = page.locator(selector).first
                if await btn.is_visible(timeout=1500):
                    await btn.click()
                    logger.debug("[%s] Dismissed cookies: %s", self.name, selector)
                    await page.wait_for_timeout(500)
                    return
            except Exception:
                continue
