"""Zoopla listing parser — extracts listings from __NEXT_DATA__ JSON."""

import json
import logging
import re
from typing import Any

from scraper.models import (
    Listing,
    LandlordType,
    PriceFrequency,
    PropertyType,
)

logger = logging.getLogger(__name__)

ZOOPLA_BASE_URL = "https://www.zoopla.co.uk"


def _extract_next_data(html: str) -> dict | None:
    """Extract the __NEXT_DATA__ JSON blob embedded in the page."""
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None


def _get_nested(obj: Any, *keys: str, default: Any = None) -> Any:
    """Safely navigate nested dicts."""
    for key in keys:
        if not isinstance(obj, dict):
            return default
        obj = obj.get(key, default)
        if obj is None:
            return default
    return obj


def _map_property_type(raw: str | None) -> PropertyType:
    if not raw:
        return PropertyType.UNKNOWN
    raw = raw.lower()
    if "studio" in raw:
        return PropertyType.STUDIO
    if "flat" in raw or "apartment" in raw:
        return PropertyType.FLAT
    if "house" in raw or "terraced" in raw or "detached" in raw or "semi" in raw:
        return PropertyType.FLAT  # treat houses as flat for our purposes
    if "room" in raw:
        return PropertyType.PRIVATE_ROOM
    return PropertyType.UNKNOWN


def _parse_price(listing: dict) -> tuple[int, PriceFrequency]:
    """Return (price_pence, frequency)."""
    # Try rental_prices block first
    rental = listing.get("rental_prices") or {}
    monthly = rental.get("per_month") or rental.get("monthly_rent")
    if monthly:
        return int(float(monthly) * 100), PriceFrequency.MONTHLY
    weekly = rental.get("per_week") or rental.get("weekly_rent")
    if weekly:
        return int(float(weekly) * 100), PriceFrequency.WEEKLY

    # Fallback: price field
    price = listing.get("price") or listing.get("displayPrice") or 0
    if isinstance(price, str):
        price = re.sub(r"[^\d.]", "", price)
        price = float(price) if price else 0
    freq_raw = (listing.get("price_frequency") or "").lower()
    freq = PriceFrequency.WEEKLY if "week" in freq_raw else PriceFrequency.MONTHLY
    return int(float(price) * 100), freq


def _extract_images(listing: dict) -> list[str]:
    images = []
    # image_url (single)
    if listing.get("image_url"):
        images.append(listing["image_url"])
    # images array
    for img in listing.get("images") or []:
        if isinstance(img, str):
            images.append(img)
        elif isinstance(img, dict):
            url = img.get("src") or img.get("url") or img.get("original_url") or ""
            if url:
                images.append(url)
    # Deduplicate preserving order
    seen: set[str] = set()
    result = []
    for u in images:
        if u not in seen:
            seen.add(u)
            result.append(u)
    return result


def _extract_amenities(listing: dict) -> list[str]:
    features = listing.get("features") or listing.get("bullets") or []
    if isinstance(features, list):
        return [str(f).strip() for f in features if f]
    return []


def _extract_postcode(listing: dict) -> str:
    postcode = listing.get("postcode") or ""
    if postcode:
        return postcode.strip()
    address = listing.get("displayAddress") or listing.get("address") or ""
    # Try to extract postcode from end of address string
    match = re.search(r"\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b", str(address).upper())
    if match:
        return match.group(1)
    return ""


def _extract_area(listing: dict) -> str:
    # shortAddress or displayAddress first segment
    short = listing.get("shortAddress") or listing.get("short_address") or ""
    if short:
        return str(short).split(",")[0].strip()
    addr = listing.get("displayAddress") or listing.get("address") or ""
    if addr:
        parts = str(addr).split(",")
        return parts[-2].strip() if len(parts) >= 2 else parts[0].strip()
    return "London"


def parse_listings_from_next_data(html: str, base_url: str = ZOOPLA_BASE_URL) -> list[Listing]:
    """Parse Zoopla listings from the __NEXT_DATA__ blob in search results HTML."""
    data = _extract_next_data(html)
    if not data:
        logger.warning("No __NEXT_DATA__ found in page")
        return []

    # Navigate to the listings array — Zoopla's structure has changed over time,
    # so we try multiple known paths.
    props = data.get("props", {})
    page_props = props.get("pageProps", {})

    raw_listings: list[dict] = []

    # Path 1: initialProps.listings.regular (older Zoopla)
    listings_block = _get_nested(page_props, "initialProps", "listings", "regular") or []
    if listings_block:
        raw_listings = listings_block

    # Path 2: searchResults.listings
    if not raw_listings:
        raw_listings = _get_nested(page_props, "searchResults", "listings") or []

    # Path 3: listings array directly in pageProps
    if not raw_listings:
        raw_listings = page_props.get("listings") or []

    # Path 4: search.listings
    if not raw_listings:
        raw_listings = _get_nested(page_props, "search", "listings") or []

    # Path 5: results array
    if not raw_listings:
        raw_listings = page_props.get("results") or []

    if not raw_listings:
        logger.warning("Could not find listings array in __NEXT_DATA__. Keys: %s", list(page_props.keys()))
        return []

    logger.info("Found %d raw listings in __NEXT_DATA__", len(raw_listings))

    results: list[Listing] = []
    for raw in raw_listings:
        if not isinstance(raw, dict):
            continue
        try:
            listing = _parse_single(raw, base_url)
            if listing:
                results.append(listing)
        except Exception as e:
            logger.debug("Failed to parse listing: %s", e)
    return results


def _parse_single(raw: dict, base_url: str) -> Listing | None:
    listing_id = str(
        raw.get("listing_id") or raw.get("id") or raw.get("listingId") or ""
    )
    if not listing_id:
        return None

    listing_uri = raw.get("listing_uri") or raw.get("detailUrl") or f"/to-rent/details/{listing_id}/"
    source_url = base_url + listing_uri if listing_uri.startswith("/") else listing_uri

    price_pence, freq = _parse_price(raw)
    if price_pence <= 0:
        return None

    prop_type_raw = (
        raw.get("property_type")
        or raw.get("propertyType")
        or raw.get("property_sub_type")
        or ""
    )
    prop_type = _map_property_type(str(prop_type_raw))

    bedrooms = raw.get("num_bedrooms") or raw.get("bedrooms") or raw.get("numBedrooms")
    bathrooms = raw.get("num_bathrooms") or raw.get("bathrooms") or raw.get("numBathrooms")

    title = (
        raw.get("title")
        or raw.get("displayAddress")
        or raw.get("address")
        or f"{bedrooms or '?'} bed in London"
    )

    agent = raw.get("agent_name") or raw.get("agentName") or raw.get("branch_name") or ""
    landlord_type = LandlordType.AGENCY if agent else LandlordType.UNKNOWN

    return Listing(
        source="zoopla",
        source_id=listing_id,
        source_url=source_url,
        title=str(title).strip(),
        price_pence=price_pence,
        price_frequency=freq,
        bills_included=False,
        address_text=str(raw.get("displayAddress") or raw.get("address") or ""),
        postcode=_extract_postcode(raw),
        latitude=raw.get("latitude") or _get_nested(raw, "coordinates", "lat"),
        longitude=raw.get("longitude") or _get_nested(raw, "coordinates", "lng"),
        area_name=_extract_area(raw),
        property_type=prop_type,
        total_rooms=int(bedrooms) if bedrooms is not None else None,
        bathrooms=int(bathrooms) if bathrooms is not None else None,
        amenities=_extract_amenities(raw),
        image_urls=_extract_images(raw),
        landlord_name=str(agent) if agent else None,
        landlord_type=landlord_type,
    )
