import { useEffect, useState } from "react";
import { ArrowLeft, History, Layers, Wrench, X, Check, Box } from "lucide-react";
import type { Vehicle, Zone, PickContext } from "@/lib/warehouse/types";
import { fillColorBgSoft, getFillRatio, getFillTier } from "@/lib/warehouse/fillColors";
import { COLORS } from "@/lib/warehouse/mockData";

interface Props {
  zone: Zone | null;
  vehiclesInZone: Vehicle[];
  onClose: () => void;
  onShowHistory: (vin: string) => void;
  initialLaneId?: string | null;
  onLaneOpened?: () => void;
  activePickLine?: PickContext | null;
  onToggleVin?: (ddpId: string, lineId: string, vin: string) => void;
}

export function ZoneDetailPanel({
  zone,
  vehiclesInZone,
  onClose,
  onShowHistory,
  initialLaneId,
  onLaneOpened,
  activePickLine,
  onToggleVin,
}: Props) {
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);

  useEffect(() => {
    if (initialLaneId && zone) {
      setSelectedLaneId(initialLaneId);
      onLaneOpened?.();
    }
  }, [initialLaneId, zone, onLaneOpened]);

  if (!zone) return null;

  const ratio = getFillRatio(zone, vehiclesInZone.length);
  const tier = getFillTier(ratio);
  const pct = Math.round(ratio * 100);

  const laneVehicles = (laneId: string) =>
    vehiclesInZone.filter((v) => v.laneId === laneId);

  const selectedLane = zone.lanes.find((l) => l.id === selectedLaneId) ?? null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-4">
          <div className="flex items-center gap-3">
            {selectedLane && (
              <button
                type="button"
                onClick={() => setSelectedLaneId(null)}
                className="rounded-md p-1.5 hover:bg-muted"
                aria-label="Quay lại danh sách làn"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${fillColorBgSoft[tier].split(" ")[0]}`}>
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {zone.label}
                {selectedLane && (
                  <span className="text-muted-foreground"> · Làn {selectedLane.label}</span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {vehiclesInZone.length}/{zone.capacity} xe · {pct}% đầy ·{" "}
                {zone.modelNames.join(", ")}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </header>

        {zone.status === "maintenance" ? (
          <MaintenanceView zone={zone} />
        ) : !selectedLane ? (
          <LaneList
            zone={zone}
            laneVehicles={laneVehicles}
            onSelectLane={setSelectedLaneId}
            activePickLine={activePickLine}
          />
        ) : (
          <VehicleListInLane
            lane={selectedLane}
            vehicles={laneVehicles(selectedLane.id)}
            onShowHistory={onShowHistory}
            activePickLine={activePickLine}
            onToggleVin={onToggleVin}
          />
        )}
      </aside>
    </div>
  );
}

function LaneList({
  zone,
  laneVehicles,
  onSelectLane,
  activePickLine,
}: {
  zone: Zone;
  laneVehicles: (laneId: string) => Vehicle[];
  onSelectLane: (laneId: string) => void;
  activePickLine?: PickContext | null;
}) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <p className="mb-3 text-xs text-muted-foreground">
        Mỗi làn gom xe cùng <span className="font-semibold text-foreground">model + màu</span>. Click vào làn để xem chi tiết xe.
      </p>
      <div className="grid gap-3">
        {zone.lanes.map((lane) => {
          const vs = laneVehicles(lane.id);
          const ratio = vs.length / lane.capacity;
          const tier = getFillTier(ratio);

          const hasMatches =
            activePickLine &&
            vs.some((v) => {
              const matchModel = !activePickLine.modelCode || v.modelCode.toLowerCase().includes(activePickLine.modelCode.toLowerCase());
              const matchType = !activePickLine.typeCode || v.typeCode.toLowerCase().includes(activePickLine.typeCode.toLowerCase());
              const matchOption = !activePickLine.optionCode || (v.optionCode && v.optionCode.toLowerCase().includes(activePickLine.optionCode.toLowerCase()));
              const matchColor = !activePickLine.colorCode || v.colorCode.toLowerCase().includes(activePickLine.colorCode.toLowerCase());
              const matchVin = !activePickLine.vin || v.vin.toLowerCase().includes(activePickLine.vin.toLowerCase());
              return matchModel && matchType && matchOption && matchColor && matchVin;
            });

          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => onSelectLane(lane.id)}
              className={`group rounded-xl border bg-background p-3 text-left transition-all hover:shadow-md ${
                hasMatches ? "border-violet-500 ring-1 ring-violet-500 bg-violet-50/30" : "hover:border-primary"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white ${fillColorBgSoft[tier].split(" ")[0]}`}>
                    {lane.label}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Làn {lane.label} ·{" "}
                      <span className="text-muted-foreground">
                        {vs.length}/{lane.capacity} xe
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      {(() => {
                        const models = Array.from(new Set(vs.map(v => v.modelName)));
                        const colorCodes = Array.from(new Set(vs.map(v => v.colorCode)));
                        const colorObjs = colorCodes.map(code => COLORS.find(c => c.code === code)).filter(Boolean);
                        return (
                          <>
                            <span>{models.length} model · {colorCodes.length} màu</span>
                            {colorObjs.slice(0, 5).map(c => c && (
                              <span
                                key={c.code}
                                className="inline-block h-3 w-3 rounded-full border"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                            {colorObjs.length > 5 && <span>+{colorObjs.length - 5}</span>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {hasMatches ? (
                    <span className="rounded bg-violet-100 px-2 py-1 font-semibold text-violet-700">Có xe khớp</span>
                  ) : (
                    <span className="text-muted-foreground">{vs.length} xe</span>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${fillColorBgSoft[tier].split(" ")[0]}`}
                  style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VehicleListInLane({
  lane,
  vehicles,
  onShowHistory,
  activePickLine,
  onToggleVin,
}: {
  lane: { id: string; label: string; primaryModelCode: string; primaryColorCode: string; capacity: number };
  vehicles: Vehicle[];
  onShowHistory: (vin: string) => void;
  activePickLine?: PickContext | null;
  onToggleVin?: (ddpId: string, lineId: string, vin: string) => void;
}) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <p className="mb-3 text-xs text-muted-foreground">
        {vehicles.length} xe trong làn {lane.label}
      </p>
      <div className="space-y-2">
        {vehicles.map((v, index) => {
          const isMatch = (() => {
            if (!activePickLine) return false;
            const matchModel = !activePickLine.modelCode || v.modelCode.toLowerCase().includes(activePickLine.modelCode.toLowerCase());
            const matchType = !activePickLine.typeCode || v.typeCode.toLowerCase().includes(activePickLine.typeCode.toLowerCase());
            const matchOption = !activePickLine.optionCode || (v.optionCode && v.optionCode.toLowerCase().includes(activePickLine.optionCode.toLowerCase()));
            const matchColor = !activePickLine.colorCode || v.colorCode.toLowerCase().includes(activePickLine.colorCode.toLowerCase());
            const matchVin = !activePickLine.vin || v.vin.toLowerCase().includes(activePickLine.vin.toLowerCase());
            return matchModel && matchType && matchOption && matchColor && matchVin;
          })();
          
          // Index cao (cuối mảng) = xe mới vào = dễ dắt ra nhất
          const obstacleCount = vehicles.length - 1 - index;

          return (
            <div
              key={v.vin}
              className={`rounded-lg border bg-background p-3 transition-colors ${
                isMatch ? "border-violet-500 bg-violet-50/50 shadow-sm ring-1 ring-violet-500/20" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{v.modelName}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span>{v.colorName}</span>
                    {v.optionCode && (
                      <>
                        <span>·</span>
                        <span>Option: {v.optionCode}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    VIN: <span className="font-mono text-foreground">{v.vin}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Mã: {v.modelCode} {v.typeCode} · Màu: {v.colorCode} · Nhập: {v.arrivedAt}
                  </div>

                  {isMatch && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`rounded flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold ${
                        obstacleCount === 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        <Box className="h-3 w-3" />
                        {obstacleCount === 0 ? "Không có vật cản" : `Bị cản bởi ${obstacleCount} xe`}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isMatch && onToggleVin && activePickLine && !activePickLine.isGlobalSearch && (
                    <button
                      type="button"
                      onClick={() => onToggleVin(activePickLine.ddpId!, activePickLine.lineId!, v.vin)}
                      className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Pick xe này
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onShowHistory(v.vin)}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground hover:bg-muted"
                  >
                    <History className="h-3 w-3" />
                    Lịch sử
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MaintenanceView({ zone }: { zone: Zone }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500 text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold text-violet-950">Zone đang bảo trì</div>
            <div className="text-xs text-violet-900/80">
              Zone {zone.label} đã đóng cửa, không nhận xe trong thời gian bảo trì.
            </div>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm">
          <div className="rounded-lg bg-white p-3">
            <dt className="text-xs font-medium uppercase text-muted-foreground">Lý do bảo trì</dt>
            <dd className="mt-1 text-foreground">{zone.maintenanceReason ?? "—"}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3">
              <dt className="text-xs font-medium uppercase text-muted-foreground">Bắt đầu</dt>
              <dd className="mt-1 font-semibold text-foreground">{zone.maintenanceStart ?? "—"}</dd>
            </div>
            <div className="rounded-lg bg-white p-3">
              <dt className="text-xs font-medium uppercase text-muted-foreground">Dự kiến gỡ bảo trì</dt>
              <dd className="mt-1 font-semibold text-emerald-700">{zone.maintenanceEnd ?? "—"}</dd>
            </div>
          </div>
          <div className="rounded-lg bg-white p-3">
            <dt className="text-xs font-medium uppercase text-muted-foreground">Sức chứa khi mở lại</dt>
            <dd className="mt-1 text-foreground">{zone.capacity} xe · {zone.lanes.length} làn</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-lg bg-white/60 p-3 text-xs text-violet-900/80">
          💡 Trong thời gian bảo trì, xe MTOC dự kiến vào zone này được tạm dồn sang zone khác. Xem lịch sử từng xe để biết chi tiết.
        </div>
      </div>
    </div>
  );
}
