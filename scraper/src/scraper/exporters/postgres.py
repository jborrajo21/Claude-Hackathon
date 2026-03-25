"""PostgreSQL ingestion for scraped listings.

Reads JSONL files and upserts listings into PostgreSQL.
Requires a running PostgreSQL instance with the swipestay database.
"""

import asyncio
import logging
from pathlib import Path

import asyncpg
import click

from scraper.config import DATABASE_URL
from scraper.exporters.jsonl import read_jsonl
from scraper.models import Listing

logger = logging.getLogger(__name__)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',

    -- Price
    price_pence INTEGER NOT NULL,
    price_frequency TEXT NOT NULL,
    price_monthly_pence INTEGER NOT NULL,
    bills_included BOOLEAN NOT NULL DEFAULT FALSE,

    -- Location
    address_text TEXT NOT NULL DEFAULT '',
    postcode TEXT NOT NULL DEFAULT '',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    area_name TEXT NOT NULL DEFAULT '',

    -- Property
    property_type TEXT NOT NULL DEFAULT 'unknown',
    total_rooms INTEGER,
    available_rooms INTEGER,
    bathrooms INTEGER,
    furnishing TEXT,

    -- Availability
    available_from DATE,
    minimum_term TEXT,
    maximum_term TEXT,

    -- Arrays (stored as JSONB)
    amenities JSONB NOT NULL DEFAULT '[]',
    image_urls JSONB NOT NULL DEFAULT '[]',

    -- Landlord
    landlord_name TEXT,
    landlord_type TEXT NOT NULL DEFAULT 'unknown',

    -- Metadata
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    listing_posted_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Dedup constraint
    UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_area ON listings(area_name);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_monthly_pence);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_postcode ON listings(postcode);
"""

UPSERT_SQL = """
INSERT INTO listings (
    id, source, source_id, source_url, title,
    price_pence, price_frequency, price_monthly_pence, bills_included,
    address_text, postcode, latitude, longitude, area_name,
    property_type, total_rooms, available_rooms, bathrooms, furnishing,
    available_from, minimum_term, maximum_term,
    amenities, image_urls,
    landlord_name, landlord_type,
    scraped_at, listing_posted_at, last_seen_at, is_active
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12, $13, $14,
    $15, $16, $17, $18, $19,
    $20, $21, $22,
    $23, $24,
    $25, $26,
    $27, $28, $29, $30
)
ON CONFLICT (source, source_id) DO UPDATE SET
    title = EXCLUDED.title,
    price_pence = EXCLUDED.price_pence,
    price_frequency = EXCLUDED.price_frequency,
    price_monthly_pence = EXCLUDED.price_monthly_pence,
    bills_included = EXCLUDED.bills_included,
    address_text = EXCLUDED.address_text,
    postcode = EXCLUDED.postcode,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    area_name = EXCLUDED.area_name,
    property_type = EXCLUDED.property_type,
    total_rooms = EXCLUDED.total_rooms,
    available_rooms = EXCLUDED.available_rooms,
    bathrooms = EXCLUDED.bathrooms,
    furnishing = EXCLUDED.furnishing,
    available_from = EXCLUDED.available_from,
    minimum_term = EXCLUDED.minimum_term,
    maximum_term = EXCLUDED.maximum_term,
    amenities = EXCLUDED.amenities,
    image_urls = EXCLUDED.image_urls,
    landlord_name = EXCLUDED.landlord_name,
    landlord_type = EXCLUDED.landlord_type,
    last_seen_at = EXCLUDED.last_seen_at,
    is_active = EXCLUDED.is_active;
"""


async def init_db(db_url: str = DATABASE_URL) -> None:
    """Create the listings table if it doesn't exist."""
    conn = await asyncpg.connect(db_url)
    try:
        await conn.execute(CREATE_TABLE_SQL)
        logger.info("Database initialized successfully")
    finally:
        await conn.close()


async def ingest_listings(
    listings: list[Listing],
    db_url: str = DATABASE_URL,
) -> int:
    """Upsert listings into PostgreSQL. Returns count of rows affected."""
    conn = await asyncpg.connect(db_url)
    count = 0

    try:
        await conn.execute(CREATE_TABLE_SQL)

        for listing in listings:
            import json

            await conn.execute(
                UPSERT_SQL,
                listing.id,
                listing.source,
                listing.source_id,
                listing.source_url,
                listing.title,
                listing.price_pence,
                listing.price_frequency.value,
                listing.price_monthly_pence,
                listing.bills_included,
                listing.address_text,
                listing.postcode,
                listing.latitude,
                listing.longitude,
                listing.area_name,
                listing.property_type.value,
                listing.total_rooms,
                listing.available_rooms,
                listing.bathrooms,
                listing.furnishing,
                listing.available_from,
                listing.minimum_term,
                listing.maximum_term,
                json.dumps(listing.amenities),
                json.dumps(listing.image_urls),
                listing.landlord_name,
                listing.landlord_type.value,
                listing.scraped_at,
                listing.listing_posted_at,
                listing.last_seen_at,
                listing.is_active,
            )
            count += 1

        logger.info(f"Ingested {count} listings into PostgreSQL")
    finally:
        await conn.close()

    return count


async def ingest_from_file(filepath: Path, db_url: str = DATABASE_URL) -> int:
    """Read a JSONL file and ingest all listings into PostgreSQL."""
    listings = read_jsonl(filepath)
    if not listings:
        logger.warning(f"No listings found in {filepath}")
        return 0

    logger.info(f"Read {len(listings)} listings from {filepath}")
    return await ingest_listings(listings, db_url)
