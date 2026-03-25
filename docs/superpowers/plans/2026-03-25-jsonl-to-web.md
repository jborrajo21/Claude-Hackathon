# JSONL → Web Frontend Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire real scraped listing data from JSONL files into the Next.js web frontend by reading files directly in `getListings()`.

**Architecture:** `getListings()` in `listings.ts` reads all `*.jsonl` files from `scraper/data/raw/` using Node.js `fs`, maps scraper fields to the web `Listing` type, and returns them. No HTTP round-trip needed — both the page and the data live in the same Next.js process. An optional `/api/listings` route handler is also added for future client-side/mobile use.

**Tech Stack:** Next.js 16 App Router, Node.js `fs`/`path`, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/src/lib/listings.ts` | **Modify** | Read JSONL files directly, map to `Listing[]`, replace mock data |
| `web/src/app/api/listings/route.ts` | **Create** (optional) | Thin wrapper over `getListings()` for future client-side use |

---

## Task 1: Update `getListings()` to read JSONL directly

**Files:**
- Modify: `web/src/lib/listings.ts`

### Field mapping: scraper JSONL → web `Listing`

| Scraper field | Web field | Notes |
|---------------|-----------|-------|
| `id` | `id` | UUID string already in JSONL |
| `title` | `title` | Direct |
| `price_monthly_pence / 100` | `price` | `price_monthly_pence` is serialised by Pydantic; divide by 100 for £ |
| `area_name \|\| "London"` | `location` | `address_text` is raw HTML — ignore it; use `area_name` |
| `total_rooms ?? available_rooms ?? 1` | `bedrooms` | `total_rooms` = total bedrooms; `available_rooms` = vacant rooms (fallback only) |
| `bathrooms ?? 1` | `bathrooms` | Default 1 |
| `property_type` | `type` | Map: `shared_room`/`private_room` → `"shared"`, `studio` → `"studio"`, `flat` → `"flat"`, `halls` → `"hall"` |
| `image_urls` | `images` | Direct array |
| `""` | `description` | Not in scraper |
| `""` | `university` | Not in scraper |
| `[]` | `transport` | Not in scraper |
| `amenities` | `amenities` | Direct array |
| `"Available now"` | `available` | `available_from` is always null in real data |
| `landlord_name ?? "Contact via SpareRoom"` | `landlordName` | |
| `source_url` | `landlordEmail` | SpareRoom listing URL as contact link |
| `""` | `landlordPhone` | Not in scraper |

**Deduplication key:** `source_id` (stable SpareRoom listing ID), not `id` (UUID regenerated each scrape run).

- [ ] **Step 1: Replace `listings.ts` with JSONL-reading implementation**

```typescript
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

export async function recordSwipe(
  listingId: string,
  direction: "left" | "right",
  note?: string
): Promise<void> {
  console.log(`[swipe] ${direction} on ${listingId}`, note ?? "");
}
```

- [ ] **Step 2: Start the dev server and open the app**

```bash
cd web && npm run dev
```

Open `http://localhost:3000`. You should see real London listings with real prices and titles (e.g. "Luxury Double Rooms Available in a Good Location") instead of the mock Shoreditch/Hackney placeholder data.

If the feed is empty: run this from the `web/` directory to verify the path resolves correctly:
```bash
node -e "const p=require('path'); const fs=require('fs'); console.log(fs.readdirSync(p.join(process.cwd(),'..','scraper','data','raw')))"
```

- [ ] **Step 3: Check for TypeScript errors**

```bash
cd web && npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors. If you see errors about `fs` or `path` not being available, add `export const runtime = 'nodejs'` at the top of any route file that uses them.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/listings.ts
git commit -m "feat: wire getListings() to scraper JSONL files, replacing mock data"
```

---

## Task 2 (Optional): Add `/api/listings` route for future client-side use

Skip this if you're short on time. Useful for the mobile app or client components later.

**Files:**
- Create: `web/src/app/api/listings/route.ts`

- [ ] **Step 1: Create the route as a thin wrapper**

```typescript
// web/src/app/api/listings/route.ts
import { getListings } from "@/lib/listings";

export async function GET() {
  const listings = await getListings();
  return Response.json(listings);
}
```

- [ ] **Step 2: Test the endpoint**

```bash
curl http://localhost:3000/api/listings | python3 -m json.tool | head -40
```

Expected: pretty-printed JSON array of listings.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/listings/route.ts
git commit -m "feat: add /api/listings route handler for client-side and mobile use"
```

---

## Verification Checklist

- [ ] Swipe feed shows real London listings (not "Modern Studio in Shoreditch")
- [ ] Prices look real (e.g. £850/mo, not round mock numbers)
- [ ] Swiping left/right still works
- [ ] Liked listings page still works
- [ ] `npm run build` passes with no TypeScript errors
