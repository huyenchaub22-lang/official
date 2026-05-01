import { Boxes, Wrench } from "lucide-react";
import type { Vehicle, Zone } from "@/lib/warehouse/types";
import { fillColorBgSoft, getFillRatio, getFillTier } from "@/lib/warehouse/fillColors";

interface ZoneCardProps {
  zone: Zone;
  vehiclesInZone: number;
  onClick: () => void;
  isActive: boolean;
  highlightCount?: number; // number of search-matched vehicles in this zone
}

function ZoneCard({ zone, vehiclesInZone, onClick, isActive, highlightCount = 0 }: ZoneCardProps) {
  const isMaint = zone.status === "maintenance";
  const isFull = zone.status === "full";
  const ratio = getFillRatio(zone, vehiclesInZone);
  const tier = isFull ? "full" : getFillTier(ratio);
  const pct = Math.round(ratio * 100);

  const bgClass = isMaint
    ? "bg-violet-500/90 hover:bg-violet-500"
    : fillColorBgSoft[tier];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full w-full flex-col rounded-lg border-2 p-2.5 text-left transition-all ${bgClass} ${
        isActive ? "border-white ring-2 ring-white/60" : "border-transparent"
      }`}
    >
      {/* Red dot indicator for search results */}
      {highlightCount > 0 && (
        <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
          {highlightCount}
        </div>
      )}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-bold text-white">
            {zone.label}
            {isMaint && <Wrench className="h-3 w-3" />}
            {isFull && <span className="rounded bg-white/30 px-1 text-[9px] font-bold uppercase">Full</span>}
          </div>
          <div className="text-[11px] text-white/90">
            {isMaint ? "Bảo trì" : `${vehiclesInZone}/${zone.capacity} xe`}
          </div>
        </div>
      </div>
      {!isMaint && (
        <div className="mt-auto pt-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-white/95">
            <span>{pct}%</span>
            <span>{zone.lanes.length} làn</span>
          </div>
        </div>
      )}
      {isMaint && zone.maintenanceEnd && (
        <div className="mt-auto pt-1 text-[10px] text-white/95">
          Đến {zone.maintenanceEnd}
        </div>
      )}
    </button>
  );
}

interface WarehouseMapProps {
  zones: Zone[];
  vehicles: Vehicle[];
  activeZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
  highlightedZones?: Map<string, number>; // zoneId -> count of matching vehicles
}

export function WarehouseMap({ zones, vehicles, activeZoneId, onZoneClick, highlightedZones }: WarehouseMapProps) {
  const countByZone = new Map<string, number>();
  vehicles.forEach((v) => {
    if (v.status === "in_zone" && v.zoneId) {
      countByZone.set(v.zoneId, (countByZone.get(v.zoneId) ?? 0) + 1);
    }
  });

  const z = (id: string) => zones.find((zz) => zz.id === id)!;
  const cnt = (id: string) => countByZone.get(id) ?? 0;

  const renderZone = (id: string) => (
    <ZoneCard
      zone={z(id)}
      vehiclesInZone={cnt(id)}
      onClick={() => onZoneClick(id)}
      isActive={activeZoneId === id}
      highlightCount={highlightedZones?.get(id) ?? 0}
    />
  );

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Click <span className="font-semibold text-foreground">zone</span> → chọn{" "}
            <span className="font-semibold text-foreground">làn</span> → xem chi tiết xe ·{" "}
            {zones.length} zones · {zones.reduce((s, zz) => s + zz.lanes.length, 0)} làn
          </p>
        </div>
        <Legend />
      </div>

      <div className="rounded-xl bg-blue-600 p-3">
        {/* Top block: A12 (tall) | Elev | (A13 / A11+A10) | Elev | DropSpare */}
        <div className="grid grid-cols-[1.3fr_48px_2.4fr_48px_120px] gap-2">
          {/* Left tall: A12 */}
          <div className="row-span-2 min-h-[180px]">{renderZone("A12")}</div>
          <FixedCell label="Elevator" tone="violet" vertical className="row-span-2" />
          {/* Middle top: A13 */}
          <div className="min-h-[88px]">{renderZone("A13")}</div>
          <FixedCell label="Elevator" tone="violet" vertical className="row-span-2" />
          <FixedCell label="Drop spare parts & wait for elevator" tone="cyan" small className="row-span-2" />
          {/* Middle bottom: A11 + A10 */}
          <div className="grid min-h-[88px] grid-cols-[1fr_1.4fr] gap-2">
            {renderZone("A11")}
            {renderZone("A10")}
          </div>
        </div>

        {/* Row 3: Office | A9 | A8 | A7 | Packing */}
        <div className="mt-2 grid grid-cols-[120px_0.55fr_1.4fr_1.6fr_100px] gap-2">
          <FixedCell label="Office" tone="pink" />
          {renderZone("A9")}
          {renderZone("A8")}
          {renderZone("A7")}
          <FixedCell label="Packing line" tone="pink" small />
        </div>

        {/* Row 4: A4 | Elev | A5 | Elev | A6 */}
        <div className="mt-2 grid grid-cols-[0.8fr_48px_2fr_48px_1fr] gap-2">
          {renderZone("A4")}
          <FixedCell label="Elevator" tone="violet" vertical />
          {renderZone("A5")}
          <FixedCell label="Elevator" tone="violet" vertical />
          {renderZone("A6")}
        </div>

        {/* Row 5: A1 | A2 | A3 */}
        <div className="mt-2 grid grid-cols-[0.8fr_2.2fr_1fr] gap-2">
          {renderZone("A1")}
          {renderZone("A2")}
          {renderZone("A3")}
        </div>

        {/* Bottom: Stairs */}
        <div className="mt-2">
          <FixedCell label="Stairs" tone="pink" small />
        </div>
      </div>
    </div>
  );
}

function FixedCell({
  label,
  tone = "slate",
  small,
  vertical,
  className = "",
}: {
  label: string;
  tone?: "slate" | "pink" | "cyan" | "yellow" | "violet";
  small?: boolean;
  vertical?: boolean;
  className?: string;
}) {
  const toneCls: Record<string, string> = {
    slate: "bg-slate-700 text-white",
    pink: "bg-pink-300 text-pink-950",
    cyan: "bg-sky-200 text-sky-950",
    yellow: "bg-yellow-200 text-yellow-900",
    violet: "bg-violet-300 text-violet-950",
  };
  return (
    <div
      className={`flex min-h-[56px] items-center justify-center rounded-lg p-2 text-center font-semibold ${toneCls[tone]} ${
        small ? "text-[11px] leading-tight" : "text-xs"
      } ${vertical ? "[writing-mode:vertical-rl] rotate-180" : ""} ${className}`}
    >
      {label}
    </div>
  );
}

function Legend() {
  const items: Array<{ label: string; cls: string }> = [
    { label: "≤40%", cls: "bg-emerald-300" },
    { label: "41–75%", cls: "bg-emerald-500" },
    { label: "76–99%", cls: "bg-emerald-700" },
    { label: "Full", cls: "bg-emerald-950" },
    { label: "Bảo trì", cls: "bg-violet-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1">
          <div className={`h-3 w-5 rounded ${it.cls}`} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
