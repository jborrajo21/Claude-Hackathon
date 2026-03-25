"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Listing } from "@/types/listing";
import { useState } from "react";

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
        {/* Image */}
        <div className="relative h-[55%] w-full overflow-hidden">
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* LIKE / NOPE stamps */}
          <motion.div
            className="absolute top-8 left-6 rounded-lg border-4 border-emerald-400 px-4 py-2 font-black text-3xl text-emerald-400 -rotate-12"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 right-6 rounded-lg border-4 border-rose-400 px-4 py-2 font-black text-3xl text-rose-400 rotate-12"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>

          {/* Type badge */}
          <div className="absolute top-4 left-4 rounded-full bg-violet-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {typeLabel[listing.type]}
          </div>

          {/* Price + title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">
              {listing.title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                £{listing.price}
              </span>
              <span className="text-white/70 text-sm">/month</span>
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
