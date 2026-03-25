import { PricingMode } from "./store";

// Default sharers count for per-person calculations on shared listings
const DEFAULT_SHARERS = 2;

const labels: Record<PricingMode, string> = {
  pcm: "/mo",
  pcw: "/wk",
  pppm: "/pp/mo",
  pppw: "/pp/wk",
};

const fullLabels: Record<PricingMode, string> = {
  pcm: "Per Calendar Month",
  pcw: "Per Week",
  pppm: "Per Person Per Month",
  pppw: "Per Person Per Week",
};

/**
 * Convert a monthly price (pcm) to the requested pricing mode.
 * For per-person modes, divides by the number of bedrooms (min 1).
 */
export function convertPrice(
  monthlyPrice: number,
  mode: PricingMode,
  bedrooms: number
): number {
  const people = mode.startsWith("ppp") ? Math.max(bedrooms, 1) : 1;
  const weekly = mode === "pcw" || mode === "pppw";
  const base = weekly ? (monthlyPrice * 12) / 52 : monthlyPrice;
  return Math.round(base / people);
}

export function priceLabel(mode: PricingMode): string {
  return labels[mode];
}

export function priceFullLabel(mode: PricingMode): string {
  return fullLabels[mode];
}
