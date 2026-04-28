import type { Zone } from "./types";

// Tier càng cao (zone càng đầy) → màu càng ĐẬM. Full = đậm nhất.
// Bảo trì có màu khác (violet) — xử lý riêng trong component.
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

// Solid (dùng cho legend / icon nhỏ) — cùng tone, đậm dần.
export const fillColorBg: Record<FillTier, string> = {
  low: "bg-emerald-300",
  mid: "bg-emerald-500",
  high: "bg-emerald-700",
  full: "bg-emerald-900",
};

// Card zone — gradient/đậm dần, full đậm nhất.
export const fillColorBgSoft: Record<FillTier, string> = {
  low: "bg-emerald-300 hover:bg-emerald-400",
  mid: "bg-emerald-500 hover:bg-emerald-600",
  high: "bg-emerald-700 hover:bg-emerald-800",
  full: "bg-emerald-950 hover:bg-emerald-900",
};
