// web/src/lib/listings.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { Listing } from "@/types/listing";

function mapPropertyType(type: string): "flat" | "shared" | "studio" | "hall" {
  switch (type) {
    case "flat": return "flat";
    case "studio": return "studio";
    case "halls": return "hall";
    default: return "shared";
  }
}

function mapScraperListing(raw: Record<string, unknown>): Listing {
  const pricePence =
    typeof raw.price_monthly_pence === "number"
      ? raw.price_monthly_pence
      : typeof raw.price_pence === "number"
        ? raw.price_frequency === "weekly"
          ? Math.round((raw.price_pence as number) * 52 / 12)
          : (raw.price_pence as number)
        : 0;

  return {
    id: String(raw.id ?? randomUUID()),
    title: String(raw.title ?? ""),
    price: Math.round(pricePence / 100),
    location: String(raw.area_name || "London"),
    bedrooms: Number(raw.total_rooms ?? raw.available_rooms ?? 1),
    bathrooms: Number(raw.bathrooms ?? 1),
    type: mapPropertyType(String(raw.property_type ?? "")),
    images: Array.isArray(raw.image_urls) ? (raw.image_urls as string[]) : [],
    description: "",
    university: "",
    transport: [],
    amenities: Array.isArray(raw.amenities) ? (raw.amenities as string[]) : [],
    available: "Available now",
    landlordName: String(raw.landlord_name ?? "Contact via SpareRoom"),
    landlordEmail: String(raw.source_url ?? ""),
    landlordPhone: "",
  };
}

export async function getListings(): Promise<Listing[]> {
  const dataDir = join(process.cwd(), "..", "scraper", "data", "raw");

  let files: string[] = [];
  try {
    files = readdirSync(dataDir).filter((f) => f.endsWith(".jsonl"));
  } catch {
    return [];
  }

  const listings: Listing[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const content = readFileSync(join(dataDir, file), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const raw = JSON.parse(trimmed) as Record<string, unknown>;
        // Deduplicate by source_id (stable across scrape runs), not UUID id
        const key = String(raw.source_id ?? raw.id ?? "");
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        listings.push(mapScraperListing(raw));
      } catch {
        // skip malformed lines
      }
    }
  }

  return listings;
}

