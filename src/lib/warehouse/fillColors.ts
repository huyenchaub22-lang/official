import type { Zone } from "./types";

export type FillTier = "low" | "mid" | "high" | "full";

export function getFillRatio(zone: Zone, vehiclesInZone: number): number {
  return vehiclesInZone / zone.capacity;
}

export function getFillTier(ratio: number): FillTier {
  if (ratio >= 1) return "full";
  if (ratio >= 0.76) return "high";
  if (ratio >= 0.41) return "mid";
  return "low";
}

export const fillColorBg: Record<FillTier, string> = {
  low: "bg-emerald-500",
  mid: "bg-amber-500",
  high: "bg-orange-500",
  full: "bg-red-500",
};

export const fillColorBgSoft: Record<FillTier, string> = {
  low: "bg-emerald-500/90 hover:bg-emerald-500",
  mid: "bg-amber-500/90 hover:bg-amber-500",
  high: "bg-orange-500/90 hover:bg-orange-500",
  full: "bg-red-500/90 hover:bg-red-500",
};
