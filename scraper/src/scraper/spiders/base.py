"""Abstract base spider for all accommodation sources."""

import abc
import logging
from typing import AsyncIterator

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from scraper.config import HEADLESS, USER_AGENT
from scraper.models import Listing
from scraper.utils.rate_limit import rate_limit_delay

logger = logging.getLogger(__name__)


class BaseSpider(abc.ABC):
    """Base class for all accommodation spiders."""

    name: str = "base"

    def __init__(self, max_pages: int = 10, headless: bool = HEADLESS):
        self.max_pages = max_pages
        self.headless = headless
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None

    async def _create_browser(self) -> Browser:
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=self.headless)
        return browser

    async def _create_context(self, browser: Browser) -> BrowserContext:
        context = await browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1280, "height": 720},
            locale="en-GB",
        )
        return context

    async def _new_page(self) -> Page:
        if not self._context:
            raise RuntimeError("Browser context not initialized")
        return await self._context.new_page()

    async def crawl(self) -> AsyncIterator[Listing]:
        """Run the spider and yield listings."""
        logger.info(f"[{self.name}] Starting crawl (max_pages={self.max_pages})")

        self._browser = await self._create_browser()
        self._context = await self._create_context(self._browser)

        try:
            page = await self._new_page()
            count = 0

            async for listing in self._scrape(page):
                count += 1
                yield listing

            logger.info(f"[{self.name}] Crawl complete. {count} listings scraped.")
        finally:
            if self._context:
                await self._context.close()
            if self._browser:
                await self._browser.close()

    @abc.abstractmethod
    async def _scrape(self, page: Page) -> AsyncIterator[Listing]:
        """Implement the scraping logic. Yield Listing objects."""
        ...

    async def delay(self) -> None:
        """Rate-limit between requests."""
        await rate_limit_delay()
