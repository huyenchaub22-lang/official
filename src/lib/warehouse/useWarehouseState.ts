import { useCallback, useMemo, useState } from "react";
import {
  initialDDPs,
  initialSpecialAreas,
  initialVehicles,
  initialZones,
} from "./mockData";
import type { DDP, SpecialArea, Vehicle, Zone } from "./types";

export function useWarehouseState() {
  const [zones] = useState<Zone[]>(initialZones);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [ddps, setDDPs] = useState<DDP[]>(initialDDPs);
  const [specialAreas] = useState<SpecialArea[]>(initialSpecialAreas);

  const vehiclesByVin = useMemo(() => {
    const m = new Map<string, Vehicle>();
    vehicles.forEach((v) => m.set(v.vin, v));
    return m;
  }, [vehicles]);

  const toggleSelectVin = useCallback((ddpId: string, lineId: string, vin: string) => {
    setDDPs((prev) =>
      prev.map((d) =>
        d.id !== ddpId
          ? d
          : {
              ...d,
              status: d.status === "waiting" ? "processing" : d.status,
              items: d.items.map((it) => {
                if (it.id !== lineId) return it;
                const has = it.selectedVins.includes(vin);
                return {
                  ...it,
                  selectedVins: has
                    ? it.selectedVins.filter((x) => x !== vin)
                    : [...it.selectedVins, vin].slice(0, it.qty),
                };
              }),
            },
      ),
    );
  }, []);

  const setSelectedVins = useCallback((ddpId: string, lineId: string, vins: string[]) => {
    setDDPs((prev) =>
      prev.map((d) =>
        d.id !== ddpId
          ? d
          : {
              ...d,
              status: d.status === "waiting" && vins.length > 0 ? "processing" : d.status,
              items: d.items.map((it) =>
                it.id !== lineId ? it : { ...it, selectedVins: vins.slice(0, it.qty) },
              ),
            },
      ),
    );
  }, []);

  const clearSelection = useCallback(
    (ddpId: string, lineId: string) => {
      setSelectedVins(ddpId, lineId, []);
    },
    [setSelectedVins],
  );

  const autoSelect = useCallback(
    (ddpId: string, lineId: string) => {
      const ddp = ddps.find((d) => d.id === ddpId);
      const item = ddp?.items.find((i) => i.id === lineId);
      if (!ddp || !item) return;
      // Hệ thống tự chọn: ưu tiên zone gợi ý → FIFO theo arrivedAt → loosen mô hình match
      const exact = vehicles.filter(
        (v) =>
          v.status === "in_zone" &&
          v.modelCode === item.modelCode &&
          v.colorCode === item.colorCode &&
          !isVinUsedElsewhere(ddp, item.id, v.vin),
      );
      const sortFn = (a: Vehicle, b: Vehicle) => {
        const aP = a.zoneId === item.suggestedZoneId ? 0 : 1;
        const bP = b.zoneId === item.suggestedZoneId ? 0 : 1;
        if (aP !== bP) return aP - bP;
        return a.arrivedAt.localeCompare(b.arrivedAt);
      };
      let candidates = exact.sort(sortFn);
      // Fallback: nếu không đủ, tìm theo modelCode bất kể màu
      if (candidates.length < item.qty) {
        const fallback = vehicles.filter(
          (v) =>
            v.status === "in_zone" &&
            v.modelCode === item.modelCode &&
            !candidates.find((c) => c.vin === v.vin) &&
            !isVinUsedElsewhere(ddp, item.id, v.vin),
        );
        candidates = [...candidates, ...fallback.sort(sortFn)];
      }
      const picked = candidates.slice(0, item.qty).map((v) => v.vin);
      setSelectedVins(ddpId, lineId, picked);
    },
    [ddps, vehicles, setSelectedVins],
  );

  const completeDDP = useCallback((ddpId: string) => {
    setDDPs((prev) =>
      prev.map((d) => {
        if (d.id !== ddpId) return d;
        const allVins = d.items.flatMap((i) => i.selectedVins);
        // mark vehicles as picked
        setVehicles((vs) =>
          vs.map((v) =>
            allVins.includes(v.vin)
              ? {
                  ...v,
                  status: "picked",
                  zoneId: undefined,
                  laneId: undefined,
                  history: [
                    ...v.history,
                    {
                      ts: new Date().toLocaleString("vi-VN"),
                      from: v.zoneId ? `${v.zoneId}/${v.laneId?.split("-").pop() ?? "?"}` : "Layout",
                      to: `${d.carrierCode} (${d.id})`,
                      note: `Xuất kho theo DDP — ${d.carrier}`,
                    },
                  ],
                }
              : v,
          ),
        );
        return {
          ...d,
          status: "done" as const,
          completedAt: new Date().toLocaleString("vi-VN"),
        };
      }),
    );
  }, []);

  const addDDP = useCallback((ddp: DDP) => {
    setDDPs((prev) => [ddp, ...prev]);
  }, []);

  return {
    zones,
    vehicles,
    vehiclesByVin,
    ddps,
    specialAreas,
    toggleSelectVin,
    setSelectedVins,
    clearSelection,
    autoSelect,
    completeDDP,
    addDDP,
    setVehicles,
    setDDPs,
  };
}

function isVinUsedElsewhere(ddp: DDP, currentLineId: string, vin: string): boolean {
  return ddp.items.some((i) => i.id !== currentLineId && i.selectedVins.includes(vin));
}

export type WarehouseState = ReturnType<typeof useWarehouseState>;
