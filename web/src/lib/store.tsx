"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Listing, LikedListing, ApplicationStatus } from "@/types/listing";

export type PricingMode = "pcm" | "pcw" | "pppm" | "pppw";

interface StoreContext {
  likes: LikedListing[];
  addLike: (listing: Listing, note?: string) => void;
  removeLike: (listingId: string) => void;
  updateNote: (listingId: string, note: string) => void;
  updateStatus: (listingId: string, status: ApplicationStatus) => void;
  addUserPhoto: (listingId: string, photoDataUrl: string) => void;
  removeUserPhoto: (listingId: string, index: number) => void;
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
}

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = "swipestay_likes";

function loadLikes(): LikedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LikedListing[];
    // Migrate stale data: old format had `image` (string) instead of `images` (array)
    return parsed.map((item) => {
      const l = item.listing;
      if (!l.images) {
        l.images = [(l as unknown as { image: string }).image].filter(Boolean);
      }
      if (!item.userPhotos) {
        item.userPhotos = [];
      }
      return item;
    });
  } catch {
    return [];
  }
}

function saveLikes(likes: LikedListing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
  } catch {
    // storage full or unavailable
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [likes, setLikes] = useState<LikedListing[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("pcm");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLikes(loadLikes());
    const savedMode = localStorage.getItem("swipestay_pricing") as PricingMode | null;
    if (savedMode) setPricingMode(savedMode);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveLikes(likes);
  }, [likes, loaded]);

  const addLike = useCallback((listing: Listing, note?: string) => {
    setLikes((prev) => {
      if (prev.some((l) => l.listing.id === listing.id)) return prev;
      return [
        ...prev,
        {
          listing,
          note,
          likedAt: new Date().toISOString(),
          status: "saved" as ApplicationStatus,
          userPhotos: [],
        },
      ];
    });
  }, []);

  const removeLike = useCallback((listingId: string) => {
    setLikes((prev) => prev.filter((l) => l.listing.id !== listingId));
  }, []);

  const updateNote = useCallback((listingId: string, note: string) => {
    setLikes((prev) =>
      prev.map((l) =>
        l.listing.id === listingId ? { ...l, note } : l
      )
    );
  }, []);

  const updateStatus = useCallback(
    (listingId: string, status: ApplicationStatus) => {
      setLikes((prev) =>
        prev.map((l) =>
          l.listing.id === listingId ? { ...l, status } : l
        )
      );
    },
    []
  );

  const addUserPhoto = useCallback((listingId: string, photoDataUrl: string) => {
    setLikes((prev) =>
      prev.map((l) =>
        l.listing.id === listingId
          ? { ...l, userPhotos: [...(l.userPhotos ?? []), photoDataUrl] }
          : l
      )
    );
  }, []);

  const removeUserPhoto = useCallback((listingId: string, index: number) => {
    setLikes((prev) =>
      prev.map((l) =>
        l.listing.id === listingId
          ? { ...l, userPhotos: (l.userPhotos ?? []).filter((_, i) => i !== index) }
          : l
      )
    );
  }, []);

  return (
    <Ctx.Provider value={{ likes, addLike, removeLike, updateNote, updateStatus, addUserPhoto, removeUserPhoto, pricingMode, setPricingMode: (mode: PricingMode) => { setPricingMode(mode); try { localStorage.setItem("swipestay_pricing", mode); } catch {} } }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
