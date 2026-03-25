"""Parser for SpareRoom listing pages."""

import logging
import re
from datetime import datetime

from bs4 import BeautifulSoup, Tag

from scraper.models import (
    Listing,
    ListingSearchResult,
    LandlordType,
    PriceFrequency,
    PropertyType,
)

logger = logging.getLogger(__name__)


def parse_search_results(html: str) -> list[ListingSearchResult]:
    """Parse SpareRoom search results page into lightweight listing summaries."""
    soup = BeautifulSoup(html, "html.parser")
    results = []

    listing_cards = soup.select("article.listing-result, li.listing-result")
    if not listing_cards:
        listing_cards = soup.select("[id^='listing-']")

    for card in listing_cards:
        try:
            result = _parse_search_card(card)
            if result:
                results.append(result)
        except Exception as e:
            logger.warning(f"Failed to parse search card: {e}")
            continue

    logger.info(f"Parsed {len(results)} results from search page")
    return results


def _parse_search_card(card: Tag) -> ListingSearchResult | None:
    """Extract listing summary from a single search result card."""
    # Extract listing URL and ID
    link = card.select_one("a[href*='/flatshare/']")
    if not link:
        link = card.select_one("a[href*='flatshare_id=']")
    if not link:
        return None

    href = link.get("href", "")
    source_url = href if href.startswith("http") else f"https://www.spareroom.co.uk{href}"

    # Extract source ID from URL
    source_id = _extract_id_from_url(source_url)
    if not source_id:
        return None

    # Title
    title_el = card.select_one("h2, h3, .listing-title, .listing__title")
    title = title_el.get_text(strip=True) if title_el else ""

    # Price
    price_el = card.select_one(".listing-price, .listing__price, strong")
    price_pence, frequency = _parse_price_text(price_el.get_text(strip=True) if price_el else "")

    # Area
    area_el = card.select_one(".listing-location, .listing__location, .area")
    area_name = area_el.get_text(strip=True) if area_el else ""

    # Image
    img = card.select_one("img")
    image_url = img.get("src") if img else None

    # Property type
    property_type = _infer_property_type(title)

    return ListingSearchResult(
        source_id=source_id,
        source_url=source_url,
        title=title,
        price_pence=price_pence,
        price_frequency=frequency,
        area_name=area_name,
        image_url=str(image_url) if image_url else None,
        property_type=property_type,
    )


def parse_listing_page(html: str, source_url: str) -> Listing | None:
    """Parse a full SpareRoom listing detail page."""
    soup = BeautifulSoup(html, "html.parser")
    source_id = _extract_id_from_url(source_url)
    if not source_id:
        return None

    # Title -- use only the first h1 text, not full page title
    title_el = soup.select_one("h1")
    title = title_el.get_text(strip=True) if title_el else ""

    # Price -- SpareRoom uses <dt class="feature-list__key">£850 pcm</dt>
    price_pence = 0
    frequency = PriceFrequency.MONTHLY

    # Primary: look for the feature-list__key with £ and pcm/pw
    price_dt = soup.select_one("dt.feature-list__key")
    if price_dt:
        price_text = price_dt.get_text(strip=True)
        price_pence, frequency = _parse_price_text(price_text)

    # Fallback: find any short text with £ and a number
    if price_pence == 0:
        for el in soup.find_all(string=re.compile(r"£\d+")):
            text = str(el).strip()
            if len(text) < 50:
                price_pence, frequency = _parse_price_text(text)
                if price_pence > 0:
                    break

    # Bills -- from feature-list dt/dd pairs
    bills_text = _get_feature_value(soup, "Bills included")
    bills_included = bills_text.lower() == "yes" if bills_text else False

    # Location -- SpareRoom uses key-features__feature list items:
    # e.g. "House share", "Plumstead", "SE18", "View on map"
    address_text = ""
    area_name = ""
    postcode = ""

    key_features = soup.select("li.key-features__feature")
    for feat in key_features:
        text = feat.get_text(strip=True)
        if not text or text in ("View on map", "Area info"):
            continue
        # Skip property type labels
        if text.lower() in ("house share", "flat share", "room"):
            continue
        # Check if it's a postcode (just the code, no trailing text)
        pc_match = re.match(r"^([A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2})\b", text.upper())
        if pc_match:
            postcode = pc_match.group(1).strip()
            continue
        # Otherwise it's likely the area name
        if not area_name and len(text) < 60:
            area_name = text

    # Fallback: extract postcode from full page text
    if not postcode:
        postcode = _extract_postcode(soup.get_text())

    address_text = f"{area_name}, {postcode}".strip(", ")

    # Property type
    property_type = _infer_property_type(title + " " + address_text)

    # Room info -- from "Total # rooms" feature
    rooms_text = _get_feature_value(soup, "Total # rooms")
    total_rooms = _extract_number(rooms_text) if rooms_text else None

    # Availability -- from feature-list
    avail_text = _get_feature_value(soup, "Available")
    available_from = _parse_date_text(avail_text) if avail_text else None

    min_term = _get_feature_value(soup, "Minimum term")
    max_term = _get_feature_value(soup, "Maximum term")

    # Furnishing
    furnish_text = _get_feature_value(soup, "Furnishings")
    furnishing = furnish_text.strip().lower() if furnish_text else None

    # Images
    images = []
    for img in soup.select("img[src*='assets'], img[src*='photos'], img.photo"):
        src = img.get("src")
        if src and "placeholder" not in str(src):
            images.append(str(src) if str(src).startswith("http") else f"https:{src}")

    # Amenities -- collect from feature-list dt/dd pairs
    amenities = []
    amenity_keys = [
        "Parking", "Garden", "Broadband", "Living room",
        "Disabled access", "Furnishings",
    ]
    for key in amenity_keys:
        val = _get_feature_value(soup, key)
        if val and val.lower() not in ("no", "", "none"):
            amenities.append(f"{key}: {val}")
    if bills_included:
        amenities.append("Bills included")

    # Landlord -- extract just the name, not the full profile block
    landlord_name = None
    landlord_type = LandlordType.PRIVATE
    # Look for "View the profile of X" pattern
    profile_link = soup.find(string=re.compile(r"View the profile of"))
    if profile_link:
        # The name is typically right after this text
        profile_text = str(profile_link)
        name_match = re.search(r"View the profile of\s+(\w+)", profile_text)
        if name_match:
            landlord_name = name_match.group(1)
    # Check for agent vs private
    if soup.find(string=re.compile(r"live out landlord|live in landlord", re.IGNORECASE)):
        landlord_type = LandlordType.PRIVATE
    elif soup.find(string=re.compile(r"agent|agency|letting", re.IGNORECASE)):
        landlord_type = LandlordType.AGENCY

    return Listing(
        source="spareroom",
        source_id=source_id,
        source_url=source_url,
        title=title,
        price_pence=price_pence,
        price_frequency=frequency,
        bills_included=bills_included,
        address_text=address_text,
        postcode=postcode,
        area_name=area_name,
        property_type=property_type,
        total_rooms=total_rooms,
        available_from=available_from,
        minimum_term=min_term,
        maximum_term=max_term,
        furnishing=furnishing,
        amenities=amenities,
        image_urls=images,
        landlord_name=landlord_name,
        landlord_type=landlord_type,
    )


# --- Helper functions ---


def _get_feature_value(soup: BeautifulSoup, label: str) -> str:
    """Get value from SpareRoom's feature-list dt/dd pairs.

    Matches <dt class="feature-list__key"> containing the label text,
    then returns the text of the next <dd> sibling.
    """
    for dt in soup.select("dt.feature-list__key"):
        if label.lower() in dt.get_text(strip=True).lower():
            dd = dt.find_next_sibling("dd")
            if dd:
                return dd.get_text(strip=True)
    return ""


def _extract_id_from_url(url: str) -> str | None:
    """Extract listing ID from a SpareRoom URL."""
    match = re.search(r"flatshare_id=(\d+)", url)
    if match:
        return match.group(1)
    match = re.search(r"/flatshare/(\d+)", url)
    if match:
        return match.group(1)
    match = re.search(r"/(\d{5,})", url)
    if match:
        return match.group(1)
    return None


def _parse_price_text(text: str) -> tuple[int, PriceFrequency]:
    """Parse price text like '£650 pcm' or '£150 pw' into pence and frequency."""
    if not text:
        return 0, PriceFrequency.MONTHLY

    # Remove commas and extra spaces
    text = text.replace(",", "").strip()

    # Extract numeric value
    match = re.search(r"£?\s*(\d+(?:\.\d{1,2})?)", text)
    if not match:
        return 0, PriceFrequency.MONTHLY

    amount = float(match.group(1))
    pence = int(amount * 100)

    # Determine frequency
    text_lower = text.lower()
    if "pw" in text_lower or "week" in text_lower or "per week" in text_lower:
        return pence, PriceFrequency.WEEKLY

    return pence, PriceFrequency.MONTHLY


def _extract_postcode(text: str) -> str:
    """Extract UK postcode from text."""
    match = re.search(
        r"[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}",
        text.upper(),
    )
    return match.group(0) if match else ""


def _infer_property_type(text: str) -> PropertyType:
    """Infer property type from descriptive text."""
    text_lower = text.lower()
    if "studio" in text_lower:
        return PropertyType.STUDIO
    if "hall" in text_lower or "halls" in text_lower:
        return PropertyType.HALLS
    if any(w in text_lower for w in ["flat", "apartment", "1 bed", "2 bed"]):
        return PropertyType.FLAT
    if any(w in text_lower for w in ["room", "share", "house share", "flatshare"]):
        return PropertyType.SHARED_ROOM
    return PropertyType.UNKNOWN


def _extract_number(text: str) -> int | None:
    """Extract first integer from text."""
    match = re.search(r"(\d+)", text)
    return int(match.group(1)) if match else None


def _parse_date_text(text: str) -> datetime | None:
    """Try to parse a date from text like 'Available from 1 Jan 2025'."""
    # Try common formats
    for fmt in ["%d %b %Y", "%d %B %Y", "%d/%m/%Y", "%Y-%m-%d"]:
        match = re.search(r"(\d{1,2}[\s/]\w+[\s/]\d{4})", text)
        if match:
            try:
                return datetime.strptime(match.group(1), fmt)
            except ValueError:
                continue
    return None


def _get_text_near_label(soup: BeautifulSoup, labels: list[str]) -> str:
    """Find text content near a label in a definition list or similar structure."""
    for label in labels:
        # Try dt/dd pairs
        dt = soup.find("dt", string=re.compile(label, re.IGNORECASE))
        if dt:
            dd = dt.find_next_sibling("dd")
            if dd:
                return dd.get_text(strip=True)

        # Try label + value patterns
        el = soup.find(string=re.compile(label, re.IGNORECASE))
        if el and el.parent:
            sibling = el.parent.find_next_sibling()
            if sibling:
                return sibling.get_text(strip=True)
    return ""
