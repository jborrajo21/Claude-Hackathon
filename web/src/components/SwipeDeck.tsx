"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SwipeCard from "./SwipeCard";
import NoteModal from "./NoteModal";
import { recordSwipe } from "@/lib/swipe";
import { useStore } from "@/lib/store";
import { Listing } from "@/types/listing";

interface SwipeDeckProps {
  listings: Listing[];
}

export default function SwipeDeck({ listings }: SwipeDeckProps) {
  const { addLike, likes } = useStore();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedListing, setLikedListing] = useState<Listing | null>(null);
  const [sessionLikeCount, setSessionLikeCount] = useState(0);
  const [gone, setGone] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function triggerScrape() {
      try {
        await fetch("/api/scrape", { method: "POST" });
        setLastUpdated(new Date());
        router.refresh();
      } catch {
        // ignore errors — scraping is best-effort
      }
    }

    triggerScrape(); // on mount
    const interval = setInterval(triggerScrape, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  const remaining = listings.slice(currentIndex);

  const advance = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 >= listings.length) setGone(true);
      return i + 1;
    });
  }, [listings.length]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const listing = listings[currentIndex];
      if (direction === "right") {
        setLikedListing(listing);
      } else {
        recordSwipe(listing.id, "left");
        advance();
      }
    },
    [currentIndex, listings, advance]
  );

  const handleNoteSubmit = (note: string) => {
    if (likedListing) {
      recordSwipe(likedListing.id, "right", note || undefined);
      addLike(likedListing, note || undefined);
      setSessionLikeCount((c) => c + 1);
    }
    setLikedListing(null);
    advance();
  };

  const handleNoteSkip = () => {
    if (likedListing) {
      recordSwipe(likedListing.id, "right");
      addLike(likedListing);
      setSessionLikeCount((c) => c + 1);
    }
    setLikedListing(null);
    advance();
  };

  if (gone) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <span className="text-4xl">🏠</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          All caught up!
        </h2>
        <p className="text-gray-500 mb-2 max-w-xs">
          You&apos;ve seen all available listings. Check back later for new ones.
        </p>
        {sessionLikeCount > 0 && (
          <p className="text-sm text-violet-600 font-medium mb-6">
            You liked {sessionLikeCount} listing{sessionLikeCount !== 1 && "s"} this session
          </p>
        )}
        <div className="flex gap-3">
          {likes.length > 0 && (
            <Link
              href="/liked"
              className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              View Liked ({likes.length})
            </Link>
          )}
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSessionLikeCount(0);
              setGone(false);
            }}
            className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Card stack */}
      <div className="absolute inset-4 sm:inset-6">
        <AnimatePresence>
          {remaining.slice(0, 2).map((listing, i) => (
            <SwipeCard
              key={listing.id}
              listing={listing}
              onSwipe={handleSwipe}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 shadow-lg">
          {listings.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 bg-violet-600"
                  : i < currentIndex
                  ? "w-1.5 bg-violet-300"
                  : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Updated:{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Note modal */}
      {likedListing && (
        <NoteModal
          listing={likedListing}
          onSubmit={handleNoteSubmit}
          onSkip={handleNoteSkip}
        />
      )}
    </div>
  );
}
