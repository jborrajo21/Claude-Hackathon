"""Pydantic models for accommodation listings."""

from datetime import date, datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, computed_field


class PropertyType(str, Enum):
    SHARED_ROOM = "shared_room"
    PRIVATE_ROOM = "private_room"
    STUDIO = "studio"
    FLAT = "flat"
    HALLS = "halls"
    UNKNOWN = "unknown"


class PriceFrequency(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class LandlordType(str, Enum):
    PRIVATE = "private"
    AGENCY = "agency"
    UNIVERSITY = "university"
    UNKNOWN = "unknown"


class Listing(BaseModel):
    """A single accommodation listing."""

    id: UUID = Field(default_factory=uuid4)
    source: str
    source_id: str
    source_url: str

    # Title
    title: str = ""

    # Price (stored in pence to avoid float issues)
    price_pence: int
    price_frequency: PriceFrequency
    bills_included: bool = False

    # Location
    address_text: str = ""
    postcode: str = ""
    latitude: float | None = None
    longitude: float | None = None
    area_name: str = ""

    # Property
    property_type: PropertyType = PropertyType.UNKNOWN
    total_rooms: int | None = None
    available_rooms: int | None = None
    bathrooms: int | None = None
    furnishing: str | None = None

    # Availability
    available_from: date | None = None
    minimum_term: str | None = None
    maximum_term: str | None = None

    # Amenities and media
    amenities: list[str] = Field(default_factory=list)
    image_urls: list[str] = Field(default_factory=list)

    # Landlord/contact
    landlord_name: str | None = None
    landlord_type: LandlordType = LandlordType.UNKNOWN

    # Metadata
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    listing_posted_at: datetime | None = None
    last_seen_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    @computed_field
    @property
    def price_monthly_pence(self) -> int:
        """Normalize price to monthly in pence."""
        if self.price_frequency == PriceFrequency.WEEKLY:
            return int(self.price_pence * 52 / 12)
        return self.price_pence

    @computed_field
    @property
    def price_monthly_display(self) -> str:
        """Human-readable monthly price."""
        pounds = self.price_monthly_pence / 100
        return f"£{pounds:,.0f}/mo"


class ListingSearchResult(BaseModel):
    """A listing as it appears in search results (less detail)."""

    source_id: str
    source_url: str
    title: str = ""
    price_pence: int = 0
    price_frequency: PriceFrequency = PriceFrequency.MONTHLY
    area_name: str = ""
    image_url: str | None = None
    property_type: PropertyType = PropertyType.UNKNOWN
