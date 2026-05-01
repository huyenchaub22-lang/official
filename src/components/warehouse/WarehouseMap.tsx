import { Boxes, Wrench, Sparkles, X, Search } from "lucide-react";
import type { Vehicle, Zone, PickContext } from "@/lib/warehouse/types";
import { fillColorBgSoft, getFillRatio, getFillTier } from "@/lib/warehouse/fillColors";

interface ZoneCardProps {
  zone: Zone;
  vehiclesInZone: number;
  matches: number;
  onClick: () => void;
  isActive: boolean;
}

function ZoneCard({ zone, vehiclesInZone, matches, onClick, isActive }: ZoneCardProps) {
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
      {matches > 0 && (
        <div className="absolute -right-2 -top-2 z-10 flex h-6 min-w-[24px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg ring-2 ring-white">
          {matches}
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
  activePickLine?: PickContext | null;
  onClearPick?: () => void;
  onAutoSelect?: (ddpId: string, lineId: string) => void;
}

export function WarehouseMap({ zones, vehicles, activeZoneId, onZoneClick, activePickLine, onClearPick, onAutoSelect }: WarehouseMapProps) {
  const countByZone = new Map<string, number>();
  const matchesByZone = new Map<string, number>();

  let totalMatches = 0;

  vehicles.forEach((v) => {
    if (v.status === "in_zone" && v.zoneId) {
      countByZone.set(v.zoneId, (countByZone.get(v.zoneId) ?? 0) + 1);
      
      const hasFilter = activePickLine && (
        activePickLine.modelCode || activePickLine.typeCode || activePickLine.optionCode || activePickLine.colorCode || activePickLine.vin
      );

      if (hasFilter) {
        const matchModel = !activePickLine.modelCode || v.modelCode.toLowerCase().includes(activePickLine.modelCode.toLowerCase());
        const matchType = !activePickLine.typeCode || v.typeCode.toLowerCase().includes(activePickLine.typeCode.toLowerCase());
        const matchOption = !activePickLine.optionCode || (v.optionCode && v.optionCode.toLowerCase().includes(activePickLine.optionCode.toLowerCase()));
        const matchColor = !activePickLine.colorCode || v.colorCode.toLowerCase().includes(activePickLine.colorCode.toLowerCase());
        const matchVin = !activePickLine.vin || v.vin.toLowerCase().includes(activePickLine.vin.toLowerCase());

        if (matchModel && matchType && matchOption && matchColor && matchVin) {
          matchesByZone.set(v.zoneId, (matchesByZone.get(v.zoneId) ?? 0) + 1);
          totalMatches++;
        }
      }
    }
  });

  const z = (id: string) => zones.find((zz) => zz.id === id)!;
  const cnt = (id: string) => countByZone.get(id) ?? 0;
  const mch = (id: string) => matchesByZone.get(id) ?? 0;

  const renderZone = (id: string) => (
    <ZoneCard
      zone={z(id)}
      vehiclesInZone={cnt(id)}
      matches={mch(id)}
      onClick={() => onZoneClick(id)}
      isActive={activeZoneId === id}
    />
  );

  return (
    <div className="relative rounded-2xl border bg-card p-4 shadow-sm">
      {activePickLine && (
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-4 rounded-full border bg-white/95 p-2 px-4 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">
                {activePickLine.isGlobalSearch ? "Tra cứu xe" : "Đang tìm:"} {activePickLine.modelName ? `${activePickLine.modelName} · ` : ""}{activePickLine.colorName || activePickLine.vin || "Tùy chỉnh"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {activePickLine.qty ? `Cần ${activePickLine.qty} xe · ` : ""}Có {totalMatches} xe trên layout
              </div>
            </div>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            {!activePickLine.isGlobalSearch && (
              <button
                type="button"
                onClick={() => activePickLine.ddpId && activePickLine.lineId && onAutoSelect?.(activePickLine.ddpId, activePickLine.lineId)}
                className="flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto Pick
              </button>
            )}
            <button
              type="button"
              onClick={onClearPick}
              className="flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={activePickLine ? "opacity-30" : ""}>
          <p className="text-sm text-muted-foreground">
            Click <span className="font-semibold text-foreground">zone</span> → chọn{" "}
            <span className="font-semibold text-foreground">làn</span> → xem chi tiết xe ·{" "}
            {zones.length} zones · {zones.reduce((s, zz) => s + zz.lanes.length, 0)} làn
          </p>
        </div>
        <Legend />
      </div>

      <div className={`rounded-xl bg-blue-600 p-3 transition-opacity duration-300 ${activePickLine ? "opacity-95" : ""}`}>
        {/* Top block: A12 (tall) | Elev | (A13 / A11+A10) | Elev | DropSpare */}
        <div className="grid grid-cols-[1.3fr_48px_2.4fr_48px_120px] gap-2">
          {/* Left tall: A12 */}
          <div className="row-span-2 min-h-[180px]">{renderZone("A12")}</div>
          <FixedCell label="Thang máy" tone="violet" vertical className="row-span-2" />
          {/* Middle top: A13 */}
          <div className="min-h-[88px]">{renderZone("A13")}</div>
          <FixedCell label="Thang máy" tone="violet" vertical className="row-span-2" />
          <FixedCell label="Khu chờ thang & linh kiện" tone="cyan" small className="row-span-2" />
          {/* Middle bottom: A11 + A10 */}
          <div className="grid min-h-[88px] grid-cols-[1fr_1.4fr] gap-2">
            {renderZone("A11")}
            {renderZone("A10")}
          </div>
        </div>

        {/* Row 3: Office | A9 | A8 | A7 | Packing */}
        <div className="mt-2 grid grid-cols-[120px_0.55fr_1.4fr_1.6fr_100px] gap-2">
          <FixedCell label="Văn phòng" tone="pink" />
          {renderZone("A9")}
          {renderZone("A8")}
          {renderZone("A7")}
          <FixedCell label="Khu đóng gói" tone="pink" small />
        </div>

        {/* Row 4: A4 | Elev | A5 | Elev | A6 */}
        <div className="mt-2 grid grid-cols-[0.8fr_48px_2fr_48px_1fr] gap-2">
          {renderZone("A4")}
          <FixedCell label="Thang máy" tone="violet" vertical />
          {renderZone("A5")}
          <FixedCell label="Thang máy" tone="violet" vertical />
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
          <FixedCell label="Cầu thang" tone="pink" small />
        </div>
      </div>
    </div>
  );
}

function FixedCell({
  label,
  tone,
  vertical,
  small,
  className = "",
}: {
  label: React.ReactNode;
  tone: "pink" | "violet" | "cyan";
  vertical?: boolean;
  small?: boolean;
  className?: string;
}) {
  const tones = {
    pink: "bg-pink-400/80 text-pink-950",
    violet: "bg-violet-400 text-violet-950",
    cyan: "bg-cyan-600 text-cyan-50",
  };
  return (
    <div
      className={`flex items-center justify-center rounded-lg ${tones[tone]} ${
        vertical ? "writing-vertical-rl" : ""
      } ${small ? "p-1.5 text-[10px]" : "p-2.5 text-xs font-medium"} ${className}`}
    >
      <span className="text-center">{label}</span>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-emerald-600" />
        <span>Trống &gt;50%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-emerald-700" />
        <span>Trống 20-50%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-emerald-900" />
        <span>Sắp đầy</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 border border-border bg-[#0f172a]" />
        <span>Đầy (100%)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex h-3 w-3 items-center justify-center rounded-sm bg-violet-500">
          <Wrench className="h-2 w-2 text-white" />
        </div>
        <span>Bảo trì</span>
      </div>
    </div>
  );
}
