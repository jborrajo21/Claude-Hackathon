"""CLI entrypoint for the SwipeStay scraper."""

import asyncio
import logging
import sys
from pathlib import Path

import click

from scraper.config import DATA_DIR, MAX_PAGES
from scraper.exporters.jsonl import JSONLExporter
from scraper.spiders.spareroom import SpareRoomSpider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


async def run_spareroom(
    where: str,
    max_rent: int,
    max_pages: int,
    output_dir: Path,
    headless: bool,
) -> Path:
    """Run the SpareRoom spider and export results to JSONL."""
    spider = SpareRoomSpider(
        where=where,
        max_rent=max_rent,
        max_pages=max_pages,
        headless=headless,
    )
    exporter = JSONLExporter(output_dir=output_dir)

    async for listing in spider.crawl():
        exporter.write(listing)
        logger.info(
            f"Scraped: {listing.title or listing.source_id} - "
            f"{listing.price_monthly_display} in {listing.area_name}"
        )

    logger.info(f"Done. {exporter.count} listings saved to {exporter.filepath}")
    return exporter.filepath


@click.group()
def cli():
    """SwipeStay accommodation scraper."""
    pass


@cli.command()
@click.option("--where", default="London", help="Location to search")
@click.option("--max-rent", default=1200, type=int, help="Max monthly rent in GBP")
@click.option("--max-pages", default=MAX_PAGES, type=int, help="Max search pages to scrape")
@click.option("--output-dir", default=str(DATA_DIR), type=click.Path(), help="Output directory")
@click.option("--no-headless", is_flag=True, help="Show browser window")
def scrape(where: str, max_rent: int, max_pages: int, output_dir: str, no_headless: bool):
    """Scrape SpareRoom for accommodation listings."""
    click.echo(f"Scraping SpareRoom for '{where}' (max £{max_rent}/mo, {max_pages} pages)")

    filepath = asyncio.run(
        run_spareroom(
            where=where,
            max_rent=max_rent,
            max_pages=max_pages,
            output_dir=Path(output_dir),
            headless=not no_headless,
        )
    )

    click.echo(f"Output: {filepath}")


@cli.command()
@click.argument("filepath", type=click.Path(exists=True))
def preview(filepath: str):
    """Preview listings from a JSONL file."""
    from scraper.exporters.jsonl import read_jsonl

    listings = read_jsonl(Path(filepath))
    click.echo(f"Found {len(listings)} listings in {filepath}\n")

    for listing in listings[:10]:
        click.echo(f"  {listing.title or 'Untitled'}")
        click.echo(f"    {listing.price_monthly_display} | {listing.area_name}")
        click.echo(f"    Type: {listing.property_type.value} | URL: {listing.source_url}")
        click.echo()

    if len(listings) > 10:
        click.echo(f"  ... and {len(listings) - 10} more")


if __name__ == "__main__":
    cli()
