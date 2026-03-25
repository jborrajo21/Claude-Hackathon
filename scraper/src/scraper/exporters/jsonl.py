"""JSONL file exporter for scraped listings."""

import json
import logging
from datetime import datetime
from pathlib import Path

from scraper.config import DATA_DIR
from scraper.models import Listing

logger = logging.getLogger(__name__)


class JSONLExporter:
    """Exports listings to JSON Lines files."""

    def __init__(self, output_dir: Path = DATA_DIR, filename: str | None = None):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"listings_{timestamp}.jsonl"

        self.filepath = self.output_dir / filename
        self._count = 0

    def write(self, listing: Listing) -> None:
        """Append a single listing to the JSONL file."""
        with open(self.filepath, "a", encoding="utf-8") as f:
            data = listing.model_dump(mode="json")
            f.write(json.dumps(data, default=str) + "\n")
        self._count += 1

    @property
    def count(self) -> int:
        return self._count

    def __str__(self) -> str:
        return f"JSONLExporter({self.filepath}, {self._count} listings)"


def read_jsonl(filepath: Path) -> list[Listing]:
    """Read listings from a JSONL file."""
    listings = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                listings.append(Listing(**data))
            except Exception as e:
                logger.warning(f"Failed to parse line {line_num} in {filepath}: {e}")
    return listings
