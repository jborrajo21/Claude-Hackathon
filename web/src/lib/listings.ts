import { Listing } from "@/types/listing";
import { mockListings } from "@/data/mock-listings";

/**
 * Fetch listings for the swipe feed.
 *
 * Currently returns mock data. To connect a real backend:
 *   1. Replace the body of this function with a fetch call, e.g.
 *      const res = await fetch(`${API_URL}/api/v1/listings/feed`);
 *      return res.json();
 *   2. Delete src/data/mock-listings.ts (or keep for tests/seeding).
 */
export async function getListings(): Promise<Listing[]> {
  // TODO: replace with API call
  return mockListings;
}

/**
 * Record a swipe action (like/pass + optional note).
 *
 * Currently a no-op. To connect a real backend:
 *   await fetch(`${API_URL}/api/v1/swipes`, {
 *     method: "POST",
 *     body: JSON.stringify({ listingId, direction, note }),
 *   });
 */
export async function recordSwipe(
  listingId: string,
  direction: "left" | "right",
  note?: string
): Promise<void> {
  // TODO: replace with API call
  console.log(`[mock] swipe ${direction} on ${listingId}`, note ?? "");
}
