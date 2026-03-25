"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

const LONDON_AREAS = [
  "Central London",
  "East London",
  "North London",
  "South London",
  "West London",
  "Canary Wharf",
  "Shoreditch",
  "Hackney",
  "Brixton",
  "Clapham",
  "Greenwich",
  "Stratford",
  "Wimbledon",
  "Islington",
  "Camden",
];

export default function LocationModal() {
  const { userLocation, setUserLocation } = useStore();
  const [customArea, setCustomArea] = useState("");

  if (userLocation !== null) return null;

  function handleAreaClick(area: string) {
    setUserLocation(area);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = customArea.trim();
    if (trimmed) {
      setUserLocation(trimmed);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-violet-600 px-6 py-5 text-center">
          <p className="text-2xl font-bold text-white tracking-tight">SwipeStay</p>
          <p className="text-violet-200 text-sm mt-0.5">Student accommodation, London</p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 text-center">
            Where do you live?
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-4">
            We&apos;ll show you accommodation near you in London
          </p>

          {/* Area grid */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {LONDON_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => handleAreaClick(area)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 text-center hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 active:scale-95 transition-all"
              >
                {area}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <p className="text-xs text-gray-400 mb-2">My area isn&apos;t listed — type it:</p>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customArea}
              onChange={(e) => setCustomArea(e.target.value)}
              placeholder="e.g. Peckham"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="submit"
              disabled={!customArea.trim()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
