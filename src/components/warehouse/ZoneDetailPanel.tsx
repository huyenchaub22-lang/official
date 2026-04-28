import { useState } from "react";
import { ArrowLeft, History, Layers, Wrench, X } from "lucide-react";
import type { Vehicle, Zone } from "@/lib/warehouse/types";
import { fillColorBgSoft, getFillRatio, getFillTier } from "@/lib/warehouse/fillColors";
import { COLORS } from "@/lib/warehouse/mockData";

interface Props {
  zone: Zone | null;
  vehiclesInZone: Vehicle[];
  onClose: () => void;
  onShowHistory: (vin: string) => void;
}

export function ZoneDetailPanel({ zone, vehiclesInZone, onClose, onShowHistory }: Props) {
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);

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
          />
        ) : (
          <VehicleListInLane
            lane={selectedLane}
            vehicles={laneVehicles(selectedLane.id)}
            onShowHistory={onShowHistory}
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
}: {
  zone: Zone;
  laneVehicles: (laneId: string) => Vehicle[];
  onSelectLane: (laneId: string) => void;
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
          const colorObj = COLORS.find((c) => c.code === lane.primaryColorCode);
          // Count how many vehicles in lane don't match the primary signature
          const drift = vs.filter(
            (v) => v.modelCode !== lane.primaryModelCode || v.colorCode !== lane.primaryColorCode,
          ).length;
          return (
            <button
              key={lane.id}
              type="button"
              onClick={() => onSelectLane(lane.id)}
              className="group rounded-xl border bg-background p-3 text-left transition-all hover:border-primary hover:shadow-md"
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
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Tính chất:</span>
                      <span className="font-medium text-foreground">
                        {vs[0]?.modelName ?? "—"}
                      </span>
                      {colorObj && (
                        <>
                          <span
                            className="inline-block h-3 w-3 rounded-full border"
                            style={{ backgroundColor: colorObj.hex }}
                          />
                          <span>{colorObj.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  {drift > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                      Lệch {drift} xe (dồn kho)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Đồng nhất</span>
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
}: {
  lane: { id: string; label: string; primaryModelCode: string; primaryColorCode: string; capacity: number };
  vehicles: Vehicle[];
  onShowHistory: (vin: string) => void;
}) {
  return (
    <div className="flex-1 overflow-auto p-4">
      <p className="mb-3 text-xs text-muted-foreground">
        {vehicles.length} xe trong làn {lane.label}
      </p>
      <div className="space-y-2">
        {vehicles.map((v) => {
          const isOutlier =
            v.modelCode !== lane.primaryModelCode || v.colorCode !== lane.primaryColorCode;
          return (
            <div
              key={v.vin}
              className="rounded-lg border bg-background p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{v.modelName}</span>
                    {isOutlier && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        Lệch (dồn kho)
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-3 w-3 rounded-full border"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span>{v.colorName}</span>
                    <span>·</span>
                    <span>{v.optionCode}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    VIN: <span className="font-mono text-foreground">{v.vin}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Model: {v.modelCode} {v.typeCode} · Nhập: {v.arrivedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onShowHistory(v.vin)}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground hover:bg-muted"
                >
                  <History className="h-3 w-3" />
                  Lịch sử ({v.history.length})
                </button>
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
