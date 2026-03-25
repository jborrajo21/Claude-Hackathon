/**
 * Client-safe swipe action helpers.
 * This module contains no Node.js-only imports and is safe to use in Client Components.
 */

export async function recordSwipe(
  listingId: string,
  direction: "left" | "right",
  note?: string
): Promise<void> {
  console.log(`[swipe] ${direction} on ${listingId}`, note ?? "");
}
