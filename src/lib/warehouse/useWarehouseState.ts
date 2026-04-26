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

  const toggleSelectVin = useCallback(
    (ddpId: string, lineId: string, vin: string) => {
      setDDPs((prev) =>
        prev.map((d) =>
          d.id !== ddpId
            ? d
            : {
                ...d,
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
    },
    [],
  );

  const setSelectedVins = useCallback(
    (ddpId: string, lineId: string, vins: string[]) => {
      setDDPs((prev) =>
        prev.map((d) =>
          d.id !== ddpId
            ? d
            : {
                ...d,
                items: d.items.map((it) =>
                  it.id !== lineId ? it : { ...it, selectedVins: vins.slice(0, it.qty) },
                ),
              },
        ),
      );
    },
    [],
  );

  const clearSelection = useCallback((ddpId: string, lineId: string) => {
    setSelectedVins(ddpId, lineId, []);
  }, [setSelectedVins]);

  const autoSelect = useCallback(
    (ddpId: string, lineId: string) => {
      const ddp = ddps.find((d) => d.id === ddpId);
      const item = ddp?.items.find((i) => i.id === lineId);
      if (!ddp || !item) return;
      // System auto-pick: pick from suggested zone first (oldest first), then any matching MTOC
      const matching = vehicles
        .filter(
          (v) =>
            v.status === "in_zone" &&
            v.modelCode === item.modelCode &&
            v.colorCode === item.colorCode,
        )
        .sort((a, b) => {
          const aPriority = a.zoneId === item.suggestedZoneId ? 0 : 1;
          const bPriority = b.zoneId === item.suggestedZoneId ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.arrivedAt.localeCompare(b.arrivedAt);
        });
      const picked = matching.slice(0, item.qty).map((v) => v.vin);
      setSelectedVins(ddpId, lineId, picked);
    },
    [ddps, vehicles, setSelectedVins],
  );

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
    setVehicles,
    setDDPs,
  };
}

export type WarehouseState = ReturnType<typeof useWarehouseState>;
