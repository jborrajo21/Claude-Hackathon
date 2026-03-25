"use client";

import { useStore, PricingMode } from "@/lib/store";

const modes: PricingMode[] = ["pcm", "pcw", "pppm", "pppw"];
const modeLabels: Record<PricingMode, string> = {
  pcm: "pcm",
  pcw: "pw",
  pppm: "pppm",
  pppw: "pppw",
};

export default function PriceToggle() {
  const { pricingMode, setPricingMode } = useStore();

  return (
    <div className="flex items-center rounded-full bg-white border border-gray-100 shadow-sm p-0.5">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => setPricingMode(m)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all ${
            pricingMode === m
              ? "bg-violet-600 text-white"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {modeLabels[m]}
        </button>
      ))}
    </div>
  );
}
