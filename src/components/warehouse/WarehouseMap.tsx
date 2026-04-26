import { Boxes } from "lucide-react";
import type { Vehicle, Zone } from "@/lib/warehouse/types";
import { fillColorBgSoft, getFillRatio, getFillTier } from "@/lib/warehouse/fillColors";

interface ZoneCardProps {
  zone: Zone;
  vehiclesInZone: number;
  onClick: () => void;
  isActive: boolean;
}

function ZoneCard({ zone, vehiclesInZone, onClick, isActive }: ZoneCardProps) {
  const ratio = getFillRatio(zone, vehiclesInZone);
  const tier = getFillTier(ratio);
  const pct = Math.round(ratio * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-full w-full flex-col rounded-lg border-2 p-3 text-left transition-all ${fillColorBgSoft[tier]} ${
        isActive ? "border-white ring-2 ring-white/60" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-bold text-white">{zone.label}</div>
          <div className="text-xs text-white/90">
            {vehiclesInZone}/{zone.capacity} xe
          </div>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
          <div className="h-full bg-white" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-white/95">
          <span>{pct}% đầy</span>
          <span>{zone.lanes.length} làn</span>
        </div>
      </div>
    </button>
  );
}

interface WarehouseMapProps {
  zones: Zone[];
  vehicles: Vehicle[];
  activeZoneId: string | null;
  onZoneClick: (zoneId: string) => void;
}

export function WarehouseMap({ zones, vehicles, activeZoneId, onZoneClick }: WarehouseMapProps) {
  const countByZone = new Map<string, number>();
  vehicles.forEach((v) => {
    if (v.status === "in_zone" && v.zoneId) {
      countByZone.set(v.zoneId, (countByZone.get(v.zoneId) ?? 0) + 1);
    }
  });

  const z = (id: string) => zones.find((zz) => zz.id === id)!;
  const cnt = (id: string) => countByZone.get(id) ?? 0;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Boxes className="h-5 w-5 text-primary" />
            Warehouse Layout Map
          </h2>
          <p className="text-sm text-muted-foreground">
            Click vào <span className="font-semibold text-foreground">zone</span> → chọn{" "}
            <span className="font-semibold text-foreground">làn</span> → xem chi tiết xe ·{" "}
            {zones.length} zones · {zones.reduce((s, z) => s + z.lanes.length, 0)} làn
          </p>
        </div>
        <Legend />
      </div>

      <div className="rounded-xl bg-slate-900 p-3">
        {/* Row 1: Z01 | Elev | Z02 | Spare */}
        <div className="grid grid-cols-[1fr_64px_1fr_88px] gap-2">
          <ZoneCard zone={z("Z01")} vehiclesInZone={cnt("Z01")} onClick={() => onZoneClick("Z01")} isActive={activeZoneId === "Z01"} />
          <FixedCell label="Elevator" />
          <ZoneCard zone={z("Z02")} vehiclesInZone={cnt("Z02")} onClick={() => onZoneClick("Z02")} isActive={activeZoneId === "Z02"} />
          <FixedCell label="Drop spare parts & wait for elevator" tone="cyan" small />
        </div>

        {/* Row 2: Z03 | Elev | Z04 | (empty space matched) */}
        <div className="mt-2 grid grid-cols-[1fr_64px_1fr_88px] gap-2">
          <ZoneCard zone={z("Z03")} vehiclesInZone={cnt("Z03")} onClick={() => onZoneClick("Z03")} isActive={activeZoneId === "Z03"} />
          <FixedCell label="Elevator" />
          <ZoneCard zone={z("Z04")} vehiclesInZone={cnt("Z04")} onClick={() => onZoneClick("Z04")} isActive={activeZoneId === "Z04"} />
          <div />
        </div>

        {/* Row 3: Office | Z05 | Z06 | Z07 | Packing */}
        <div className="mt-2 grid grid-cols-[180px_1fr_1fr_1fr_88px] gap-2">
          <FixedCell label="Office" tone="pink" />
          <ZoneCard zone={z("Z05")} vehiclesInZone={cnt("Z05")} onClick={() => onZoneClick("Z05")} isActive={activeZoneId === "Z05"} />
          <ZoneCard zone={z("Z06")} vehiclesInZone={cnt("Z06")} onClick={() => onZoneClick("Z06")} isActive={activeZoneId === "Z06"} />
          <ZoneCard zone={z("Z07")} vehiclesInZone={cnt("Z07")} onClick={() => onZoneClick("Z07")} isActive={activeZoneId === "Z07"} />
          <FixedCell label="Packing line" tone="yellow" small />
        </div>

        {/* Row 4: Z08 | Z09 | Elev | A6 */}
        <div className="mt-2 grid grid-cols-[1fr_1fr_64px_1fr] gap-2">
          <ZoneCard zone={z("Z08")} vehiclesInZone={cnt("Z08")} onClick={() => onZoneClick("Z08")} isActive={activeZoneId === "Z08"} />
          <ZoneCard zone={z("Z09")} vehiclesInZone={cnt("Z09")} onClick={() => onZoneClick("Z09")} isActive={activeZoneId === "Z09"} />
          <FixedCell label="Elevator" />
          <FixedCell label="A6: Drop spare parts" tone="cyan" />
        </div>

        {/* Row 5: Z10 | Z11 | A3 */}
        <div className="mt-2 grid grid-cols-[1fr_1fr_1fr] gap-2">
          <ZoneCard zone={z("Z10")} vehiclesInZone={cnt("Z10")} onClick={() => onZoneClick("Z10")} isActive={activeZoneId === "Z10"} />
          <ZoneCard zone={z("Z11")} vehiclesInZone={cnt("Z11")} onClick={() => onZoneClick("Z11")} isActive={activeZoneId === "Z11"} />
          <FixedCell label="A3: Spare parts" tone="cyan" />
        </div>

        {/* Stairs */}
        <div className="mt-2">
          <FixedCell label="Stairs" tall />
        </div>
      </div>
    </div>
  );
}

function FixedCell({
  label,
  tone = "slate",
  small,
  tall,
}: {
  label: string;
  tone?: "slate" | "pink" | "cyan" | "yellow";
  small?: boolean;
  tall?: boolean;
}) {
  const toneCls: Record<string, string> = {
    slate: "bg-slate-700 text-white",
    pink: "bg-pink-200 text-pink-900",
    cyan: "bg-sky-200 text-sky-900",
    yellow: "bg-yellow-200 text-yellow-900",
  };
  return (
    <div
      className={`flex items-center justify-center rounded-lg p-3 text-center font-medium ${toneCls[tone]} ${
        small ? "text-[11px] leading-tight" : "text-sm"
      } ${tall ? "min-h-24" : "min-h-full"}`}
    >
      {label}
    </div>
  );
}

function Legend() {
  const items: Array<{ label: string; cls: string }> = [
    { label: "≤40% đầy", cls: "bg-emerald-500" },
    { label: "41–75%", cls: "bg-amber-500" },
    { label: "76–99%", cls: "bg-orange-500" },
    { label: "Full 100%", cls: "bg-red-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <div className={`h-3 w-6 rounded ${it.cls}`} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
