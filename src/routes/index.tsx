import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { useWarehouseState } from "@/lib/warehouse/useWarehouseState";
import { totalCapacity } from "@/lib/warehouse/mockData";
import { WarehouseMap } from "@/components/warehouse/WarehouseMap";
import { ZoneDetailPanel } from "@/components/warehouse/ZoneDetailPanel";
import { VehicleHistoryDrawer } from "@/components/warehouse/VehicleHistoryDrawer";
import { DDPDetailPanel } from "@/components/warehouse/DDPDetailPanel";
import { Sidebar } from "@/components/warehouse/Sidebar";
import { SpecialAreasPanel } from "@/components/warehouse/SpecialAreasPanel";
import { ZoneDistribution } from "@/components/warehouse/ZoneDistribution";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quản lý Layout Kho Xe Honda — Vehicle Flow Optimizer" },
      {
        name: "description",
        content:
          "Quản lý layout kho xe Honda: zone, làn, MTOC, DDP và xử lý lỗi ngoại quan.",
      },
    ],
  }),
  component: WarehousePage,
});

function WarehousePage() {
  const state = useWarehouseState();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeDDPId, setActiveDDPId] = useState<string | null>(null);
  const [historyVin, setHistoryVin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const inLayoutCount = state.vehicles.filter((v) => v.status === "in_zone").length;
  const freeSlots = totalCapacity - inLayoutCount;
  const processingDDPs = state.ddps.filter((d) => d.status === "processing").length;

  const activeZone = useMemo(
    () => state.zones.find((z) => z.id === activeZoneId) ?? null,
    [state.zones, activeZoneId],
  );
  const activeDDP = useMemo(
    () => state.ddps.find((d) => d.id === activeDDPId) ?? null,
    [state.ddps, activeDDPId],
  );
  const historyVehicle = historyVin ? state.vehiclesByVin.get(historyVin) ?? null : null;
  const vehiclesInActiveZone = useMemo(
    () => (activeZone ? state.vehicles.filter((v) => v.zoneId === activeZone.id) : []),
    [activeZone, state.vehicles],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                Quản lý Layout Kho Xe Honda — LOG2
              </h1>
              <p className="text-xs text-muted-foreground">
                Vehicle Flow Optimizer · {totalCapacity} xe capacity · {state.zones.length} zones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderStat value={`${inLayoutCount}/${totalCapacity}`} label="Xe trong layout" tone="text-emerald-600" />
            <HeaderStat value={String(freeSlots)} label="Chỗ trống" tone="text-blue-600" />
            <HeaderStat value={String(processingDDPs)} label="DDP đang xử lý" tone="text-orange-600" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-5">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <Sidebar
            ddps={state.ddps}
            vehicles={state.vehicles}
            onOpenDDP={(id) => setActiveDDPId(id)}
            activeDDPId={activeDDPId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectVin={(vin) => setHistoryVin(vin)}
            onUploadDDP={state.addDDP}
          />

          <div className="space-y-5">
            <WarehouseMap
              zones={state.zones}
              vehicles={state.vehicles}
              activeZoneId={activeZoneId}
              onZoneClick={(id) => setActiveZoneId(id)}
            />

            <SpecialAreasPanel areas={state.specialAreas} />

            <ZoneDistribution zones={state.zones} vehicles={state.vehicles} />
          </div>
        </div>
      </main>

      {/* Drawers / Panels */}
      <ZoneDetailPanel
        zone={activeZone}
        vehiclesInZone={vehiclesInActiveZone}
        onClose={() => setActiveZoneId(null)}
        onShowHistory={(vin) => setHistoryVin(vin)}
      />
      <DDPDetailPanel
        ddp={activeDDP}
        vehicles={state.vehicles}
        onClose={() => setActiveDDPId(null)}
        onToggleVin={state.toggleSelectVin}
        onClearLine={state.clearSelection}
        onAutoSelect={state.autoSelect}
        onComplete={state.completeDDP}
      />
      <VehicleHistoryDrawer vehicle={historyVehicle} onClose={() => setHistoryVin(null)} />
    </div>
  );
}

function HeaderStat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-1.5 text-center">
      <div className={`text-base font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
