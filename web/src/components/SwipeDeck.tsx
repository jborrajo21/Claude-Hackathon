"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "./SwipeCard";
import NoteModal from "./NoteModal";
import { mockListings } from "@/data/listings";
import { Listing, SwipeResult } from "@/types/listing";

export default function SwipeDeck() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedListing, setLikedListing] = useState<Listing | null>(null);
  const [results, setResults] = useState<SwipeResult[]>([]);
  const [gone, setGone] = useState(false);

  const remaining = mockListings.slice(currentIndex);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const listing = mockListings[currentIndex];
      if (direction === "right") {
        setLikedListing(listing);
      } else {
        setResults((prev) => [...prev, { listing, direction }]);
        setCurrentIndex((i) => {
          if (i + 1 >= mockListings.length) setGone(true);
          return i + 1;
        });
      }
    },
    [currentIndex]
  );

  const handleNoteSubmit = (note: string) => {
    if (likedListing) {
      setResults((prev) => [
        ...prev,
        { listing: likedListing, direction: "right", note: note || undefined },
      ]);
    }
    setLikedListing(null);
    setCurrentIndex((i) => {
      if (i + 1 >= mockListings.length) setGone(true);
      return i + 1;
    });
  };

  const handleNoteSkip = () => {
    if (likedListing) {
      setResults((prev) => [
        ...prev,
        { listing: likedListing, direction: "right" },
      ]);
    }
    setLikedListing(null);
    setCurrentIndex((i) => {
      if (i + 1 >= mockListings.length) setGone(true);
      return i + 1;
    });
  };

  const liked = results.filter((r) => r.direction === "right");

  if (gone) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <span className="text-4xl">🏠</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          All caught up!
        </h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          You&apos;ve seen all available listings. Check back later for new ones.
        </p>
        {liked.length > 0 && (
          <div className="w-full max-w-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Your liked listings ({liked.length})
            </h3>
            <div className="space-y-2">
              {liked.map((r) => (
                <div
                  key={r.listing.id}
                  className="rounded-2xl bg-white border border-gray-100 p-4 text-left shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {r.listing.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        £{r.listing.price}/mo · {r.listing.location}
                      </p>
                    </div>
                    <span className="text-emerald-500 text-lg">💜</span>
                  </div>
                  {r.note && (
                    <p className="mt-2 text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2">
                      {r.note}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    {r.listing.landlordEmail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setCurrentIndex(0);
            setResults([]);
            setGone(false);
          }}
          className="mt-8 rounded-2xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          Start Over
        </button>
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 shadow-lg">
          {mockListings.map((_, i) => (
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
