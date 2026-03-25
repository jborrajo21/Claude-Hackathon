"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Listing } from "@/types/listing";
import { useState, useCallback, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { convertPrice, priceLabel } from "@/lib/pricing";

const transportIcons: Record<string, string> = {
  tube: "🚇",
  bus: "🚌",
  bike: "🚲",
  walk: "🚶",
};

interface SwipeCardProps {
  listing: Listing;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export default function SwipeCard({ listing, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [expanded, setExpanded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const { pricingMode } = useStore();
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images = listing.images;

  // Auto-advance every 4 seconds when this is the top card
  useEffect(() => {
    if (!isTop || images.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % images.length);
    }, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isTop, images.length]);

  // Reset timer on manual navigation
  function resetAutoplay() {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(() => {
        setImgIndex((i) => (i + 1) % images.length);
      }, 4000);
    }
  }

  const goNext = useCallback(() => {
    setImgIndex((i) => (i + 1) % images.length);
    resetAutoplay();
  }, [images.length]);

  const goPrev = useCallback(() => {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
    resetAutoplay();
  }, [images.length]);

  const handleImageTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const half = rect.width / 2;
      if (tapX > half) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  function handleDragEnd(_: unknown, info: PanInfo) {
    const threshold = 120;
    if (info.offset.x > threshold) {
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      onSwipe("left");
    }
  }

  const typeLabel: Record<string, string> = {
    flat: "Flat",
    shared: "Shared",
    studio: "Studio",
    hall: "Student Hall",
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Image carousel */}
        <div className="relative h-[55%] w-full overflow-hidden" onClick={handleImageTap}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${listing.title} ${i + 1}`}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
              style={{ opacity: i === imgIndex ? 1 : 0 }}
              draggable={false}
            />
          ))}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Image indicator dots */}
          {images.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    i === imgIndex ? "w-6 bg-white" : "w-6 bg-white/35"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Arrow buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* LIKE / NOPE stamps */}
          <motion.div
            className="absolute top-8 left-6 rounded-lg border-4 border-emerald-400 px-4 py-2 font-black text-3xl text-emerald-400 -rotate-12 pointer-events-none"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 right-6 rounded-lg border-4 border-rose-400 px-4 py-2 font-black text-3xl text-rose-400 rotate-12 pointer-events-none"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>

          {/* Type badge */}
          <div className="absolute top-4 left-4 rounded-full bg-violet-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm pointer-events-none">
            {typeLabel[listing.type]}
          </div>

          {/* Price + title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">
              {listing.title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                £{convertPrice(listing.price, pricingMode, listing.bedrooms)}
              </span>
              <span className="text-white/70 text-sm">{priceLabel(pricingMode)}</span>
              <span className="text-white/50 mx-1">·</span>
              <span className="text-white/80 text-sm">{listing.location}</span>
            </div>
          </div>
        </div>

        {/* Details section */}
        <div
          className="h-[45%] overflow-y-auto px-5 pt-4 pb-6"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Room info pills */}
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              🛏 {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              🚿 {listing.bathrooms} bath
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              🎓 {listing.university}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              📅 {listing.available}
            </span>
          </div>

          {/* Transport times */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Transport to uni
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {listing.transport.map((t) => (
                <div
                  key={t.mode}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2"
                >
                  <span className="text-base">{transportIcons[t.mode]}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-800">
                      {t.duration}
                    </span>
                    {t.station && (
                      <span className="block text-[10px] text-gray-400 truncate">
                        {t.station}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {listing.description}
          </p>

          {/* Amenities */}
          <div className="flex gap-1.5 flex-wrap">
            {listing.amenities.map((a) => (
              <span
                key={a}
                className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
