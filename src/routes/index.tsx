import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useWarehouseState } from "@/lib/warehouse/useWarehouseState";
import { useKIState } from "@/lib/warehouse/useKIState";
import { totalCapacity } from "@/lib/warehouse/mockData";
import type { PickContext } from "@/lib/warehouse/types";
import { WarehouseMap } from "@/components/warehouse/WarehouseMap";
import { ZoneDetailPanel } from "@/components/warehouse/ZoneDetailPanel";
import { VehicleHistoryDrawer } from "@/components/warehouse/VehicleHistoryDrawer";
import { DDPDetailPanel } from "@/components/warehouse/DDPDetailPanel";
import { Sidebar } from "@/components/warehouse/Sidebar";
import { SpecialAreasPanel } from "@/components/warehouse/SpecialAreasPanel";
import { KIModeBanner } from "@/components/warehouse/KIModeBanner";
import { PhieuDetailPanel } from "@/components/warehouse/PhieuDetailPanel";
import { KIDashboard } from "@/components/warehouse/KIDashboard";
import hondaLogo from "@/assets/honda-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quản lý Layout Kho Xe Honda — Vehicle Flow Optimizer" },
      {
        name: "description",
        content: "Quản lý layout kho xe Honda: zone, làn, MTOC, đơn hàng và xử lý lỗi ngoại quan.",
      },
    ],
  }),
  component: WarehousePage,
});

function WarehousePage() {
  const state = useWarehouseState();
  const kiState = useKIState();

  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeDDPId, setActiveDDPId] = useState<string | null>(null);
  const [historyVin, setHistoryVin] = useState<string | null>(null);
  const [activePickLine, setActivePickLine] = useState<PickContext | null>(null);

  // KI-specific UI state
  const [activePhieuNo, setActivePhieuNo] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

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
  const historyVehicle = historyVin ? (state.vehiclesByVin.get(historyVin) ?? null) : null;
  const vehiclesInActiveZone = useMemo(
    () => (activeZone ? state.vehicles.filter((v) => v.zoneId === activeZone.id) : []),
    [activeZone, state.vehicles],
  );

  const activePhieu = useMemo(
    () => kiState.phieuList.find((p) => p.phieuNo === activePhieuNo) ?? null,
    [kiState.phieuList, activePhieuNo],
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* KI Mode Banner */}
      {kiState.kiMode && kiState.kiSnapshot && (
        <KIModeBanner
          snapshotLabel={kiState.kiSnapshot.periodLabel}
          createdAt={kiState.kiSnapshot.createdAt}
          onEndKI={kiState.endKI}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <img
              src={hondaLogo}
              alt="Honda Digital Layout Warehouse"
              className="h-12 w-12 object-contain"
            />
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
            <HeaderStat
              value={`${inLayoutCount}/${totalCapacity}`}
              label="Xe trong layout"
              tone="text-emerald-600"
            />
            <HeaderStat value={String(freeSlots)} label="Chỗ trống" tone="text-blue-600" />
            <HeaderStat
              value={String(processingDDPs)}
              label="Đơn đang xử lý"
              tone="text-orange-600"
            />
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
            onUploadDDP={state.addDDP}
            onStartGlobalSearch={(ctx) => setActivePickLine({ ...ctx, isGlobalSearch: true })}
            kiState={kiState}
            onOpenPhieu={(no) => setActivePhieuNo(no)}
            onOpenDashboard={() => setShowDashboard(true)}
          />

          <div className="space-y-5">
            <WarehouseMap
              zones={state.zones}
              vehicles={state.vehicles}
              activeZoneId={activeZoneId}
              onZoneClick={(id) => setActiveZoneId(id)}
              activePickLine={activePickLine}
              onClearPick={() => setActivePickLine(null)}
              onAutoSelect={state.autoSelect}
            />

            <SpecialAreasPanel areas={state.specialAreas} />
          </div>
        </div>
      </main>

      {/* Drawers / Panels */}
      <ZoneDetailPanel
        zone={activeZone}
        vehiclesInZone={vehiclesInActiveZone}
        onClose={() => setActiveZoneId(null)}
        onShowHistory={(vin) => setHistoryVin(vin)}
        activePickLine={activePickLine}
        onToggleVin={state.toggleSelectVin}
      />
      <DDPDetailPanel
        ddp={activeDDP}
        vehicles={state.vehicles}
        onClose={() => setActiveDDPId(null)}
        onComplete={state.completeDDP}
        activePickLine={activePickLine}
        onStartPick={setActivePickLine}
      />
      <VehicleHistoryDrawer vehicle={historyVehicle} onClose={() => setHistoryVin(null)} />

      {/* KI Panels */}
      <PhieuDetailPanel
        phieu={activePhieu}
        kiState={kiState}
        onClose={() => setActivePhieuNo(null)}
      />
      {showDashboard && kiState.kiSnapshot && (
        <KIDashboard
          kiSnapshot={kiState.kiSnapshot}
          phieuList={kiState.phieuList}
          onClose={() => setShowDashboard(false)}
          onOpenPhieu={(no) => {
            setShowDashboard(false);
            setActivePhieuNo(no);
          }}
        />
      )}
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
