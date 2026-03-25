"""SpareRoom spider — scrapes London student accommodation listings."""

import logging
from typing import AsyncIterator
from urllib.parse import urlencode

from playwright.async_api import Page

from scraper.config import MAX_PAGES, SPAREROOM_SEARCH_URL
from scraper.models import Listing
from scraper.parsers.spareroom import parse_listing_page, parse_search_results
from scraper.spiders.base import BaseSpider

logger = logging.getLogger(__name__)


class SpareRoomSpider(BaseSpider):
    """Spider for spareroom.co.uk — the UK's leading flatshare site."""

    name = "spareroom"

    def __init__(
        self,
        max_rent: int = 1200,
        where: str = "London",
        max_pages: int = MAX_PAGES,
        headless: bool = True,
    ):
        super().__init__(max_pages=max_pages, headless=headless)
        self.max_rent = max_rent
        self.where = where

    def _build_search_url(self, page_num: int = 1) -> str:
        """Build SpareRoom search URL with filters."""
        params = {
            "search_type": "offered",
            "where": self.where,
            "max_rent": self.max_rent,
            "per": "pcm",
            "page": page_num,
        }
        return f"{SPAREROOM_SEARCH_URL}/?{urlencode(params)}"

    async def _scrape(self, page: Page) -> AsyncIterator[Listing]:
        """Scrape SpareRoom search results and individual listing pages."""
        for page_num in range(1, self.max_pages + 1):
            search_url = self._build_search_url(page_num)
            logger.info(f"[{self.name}] Fetching search page {page_num}: {search_url}")

            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                # Accept cookies if prompted
                await self._dismiss_cookies(page)
                await page.wait_for_timeout(2000)
            except Exception as e:
                logger.error(f"[{self.name}] Failed to load search page {page_num}: {e}")
                break

            html = await page.content()
            search_results = parse_search_results(html)

            if not search_results:
                logger.info(f"[{self.name}] No results on page {page_num}, stopping.")
                break

            logger.info(
                f"[{self.name}] Found {len(search_results)} listings on page {page_num}"
            )

            # Visit each listing detail page
            for result in search_results:
                await self.delay()

                try:
                    listing = await self._scrape_listing(page, result.source_url)
                    if listing:
                        yield listing
                except Exception as e:
                    logger.warning(
                        f"[{self.name}] Failed to scrape listing {result.source_id}: {e}"
                    )
                    continue

            await self.delay()

    async def _scrape_listing(self, page: Page, url: str) -> Listing | None:
        """Scrape a single listing detail page."""
        logger.debug(f"[{self.name}] Fetching listing: {url}")

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1500)
        except Exception as e:
            logger.warning(f"[{self.name}] Timeout loading {url}: {e}")
            return None

        html = await page.content()
        return parse_listing_page(html, url)

    async def _dismiss_cookies(self, page: Page) -> None:
        """Try to dismiss cookie consent banners."""
        selectors = [
            "button[id*='accept']",
            "button[class*='accept']",
            "button:has-text('Accept')",
            "button:has-text('Got it')",
            "button:has-text('OK')",
            "#onetrust-accept-btn-handler",
        ]
        for selector in selectors:
            try:
                btn = page.locator(selector).first
                if await btn.is_visible(timeout=1000):
                    await btn.click()
                    logger.debug(f"[{self.name}] Dismissed cookies with: {selector}")
                    return
            except Exception:
                continue
