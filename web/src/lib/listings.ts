// web/src/lib/listings.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { Listing } from "@/types/listing";

const LONDON_PREFIXES = new Set([
  // Inner London
  "E", "EC", "N", "NW", "SE", "SW", "W", "WC",
  // Outer London
  "BR", "CR", "DA", "EN", "HA", "IG", "KT", "RM", "SM", "TW", "UB",
]);

function extractPostcodePrefix(postcode: unknown): string | null {
  if (typeof postcode !== "string" || postcode.trim() === "") return null;
  // Remove spaces and uppercase
  const clean = postcode.replace(/\s+/g, "").toUpperCase();
  // Extract leading letters (outward code letters only)
  const match = clean.match(/^([A-Z]{1,2})\d/);
  if (!match) return null;
  return match[1];
}

function isLondonListing(raw: Record<string, unknown>): boolean {
  const postcode = raw.postcode;
  if (typeof postcode !== "string" || postcode.trim() === "") {
    // Keep listings with missing postcodes
    return true;
  }
  const prefix = extractPostcodePrefix(postcode);
  if (!prefix) return true; // Can't parse — keep it
  return LONDON_PREFIXES.has(prefix);
}

function extractAreaName(raw: Record<string, unknown>): string {
  const amenities = Array.isArray(raw.amenities) ? (raw.amenities as string[]) : [];

  // amenities[1] is typically the area name
  if (amenities.length >= 2) {
    const candidate = String(amenities[1]).trim();
    // Skip if it looks like a postcode prefix (e.g. "SE18Area info", "BR1")
    if (candidate && !/^[A-Z]{1,2}\d/.test(candidate)) {
      return candidate;
    }
  }

  // Fallback: use first 6 chars of postcode
  if (typeof raw.postcode === "string" && raw.postcode.trim()) {
    return raw.postcode.trim().slice(0, 6);
  }

  return "London";
}

function extractLandlordName(raw: Record<string, unknown>): string {
  const raw_name = typeof raw.landlord_name === "string" ? raw.landlord_name : "";

  // Try doubled-name pattern: "View the profile of GiftGift..." → "Gift"
  const doubledMatch = raw_name.match(/View the profile of ([A-Za-z]+)\1/);
  if (doubledMatch) return doubledMatch[1];

  // Fallback: just take first word after "View the profile of"
  const singleMatch = raw_name.match(/View the profile of ([A-Za-z]+)/);
  if (singleMatch) return singleMatch[1];

  return "Contact via SpareRoom";
}

function cleanAmenities(raw: Record<string, unknown>): string[] {
  const amenities = Array.isArray(raw.amenities) ? (raw.amenities as string[]) : [];
  return amenities
    .map((a) => String(a).trim())
    .filter((a) => {
      if (!a) return false;
      if (a === "House share") return false;
      if (/^[A-Z]{1,2}\d/.test(a)) return false; // postcode-like prefix
      if (a.includes("Area info")) return false;
      if (a.length > 80) return false;
      return true;
    });
}

function buildDescription(raw: Record<string, unknown>): string {
  const parts: string[] = [];

  // Furnishing
  if (typeof raw.furnishing === "string" && raw.furnishing.trim()) {
    const f = raw.furnishing.trim();
    parts.push(f.charAt(0).toUpperCase() + f.slice(1));
  }

  // Type label
  const typeLabels: Record<string, string> = {
    shared_room: "room in shared house",
    private_room: "private room",
    studio: "studio flat",
    flat: "whole flat",
    halls: "student halls",
  };
  const propType = String(raw.property_type ?? "");
  const typeLabel = typeLabels[propType] ?? "property";

  if (parts.length > 0) {
    parts[parts.length - 1] += ", " + typeLabel;
  } else {
    parts.push(typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1));
  }

  // Bills
  const billsText = raw.bills_included === true ? "Bills included" : "Bills not included";
  parts.push(billsText);

  // Min term
  if (
    typeof raw.minimum_term === "string" &&
    raw.minimum_term.trim() !== "" &&
    raw.minimum_term !== "None"
  ) {
    parts.push(`Min. term: ${raw.minimum_term}`);
  }

  // Join: first two parts separated by ". ", then ". " for the rest
  if (parts.length === 0) return "";
  // The first comma-joined part is already built, remaining parts are sentences
  // parts[0] = "Furnished, room in shared house"
  // parts[1] = "Bills not included"
  // parts[2] = "Min. term: 3 months"
  return parts.join(". ") + ".";
}

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
    location: extractAreaName(raw),
    bedrooms: Number(raw.total_rooms ?? raw.available_rooms ?? 1),
    bathrooms: Number(raw.bathrooms ?? 1),
    type: mapPropertyType(String(raw.property_type ?? "")),
    images: Array.isArray(raw.image_urls) ? (raw.image_urls as string[]) : [],
    description: buildDescription(raw),
    university: "",
    transport: [],
    amenities: cleanAmenities(raw),
    available: "Available now",
    landlordName: extractLandlordName(raw),
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

        // Filter out non-London listings
        if (!isLondonListing(raw)) continue;

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
