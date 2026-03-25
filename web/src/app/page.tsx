import SwipeDeck from "@/components/SwipeDeck";
import { getListings } from "@/lib/listings";

export default async function Home() {
  const listings = await getListings();

  return <SwipeDeck listings={listings} />;
}
