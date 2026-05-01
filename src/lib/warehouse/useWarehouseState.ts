import { useCallback, useMemo, useState } from "react";
import {
  initialDDPs,
  initialSpecialAreas,
  initialVehicles,
  initialZones,
  fmtTime,
  rand,
  nextVin,
  COLORS,
  MODELS,
} from "./mockData";
import type { DDP, SpecialArea, Vehicle, Zone } from "./types";

export function useWarehouseState() {
  const [zones, setZones] = useState<Zone[]>(initialZones);
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
      // Hệ thống tự chọn: chỉ lấy xe khớp ĐÚNG modelCode + colorCode (exact match)
      // Ưu tiên zone gợi ý → FIFO theo arrivedAt
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
      const candidates = exact.sort(sortFn);
      // Chỉ chọn tối đa min(số xe khớp, số xe yêu cầu) — không bao giờ vượt tồn kho
      const pickCount = Math.min(candidates.length, item.qty);
      const picked = candidates.slice(0, pickCount).map((v) => v.vin);
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

    const existingCount = new Map<string, number>();
    vehicles.forEach(v => {
      if (v.status === "in_zone") {
        const key = `${v.modelCode}|${v.colorCode}`;
        existingCount.set(key, (existingCount.get(key) ?? 0) + 1);
      }
    });

    const newVehicles: Vehicle[] = [];
    const updatedZones = JSON.parse(JSON.stringify(zones)) as Zone[];

    const activeZoneIds = updatedZones.filter((z) => z.status !== "maintenance").map((z) => z.id);
    let paddingCount = 0;

    ddp.items.forEach(item => {
       const key = `${item.modelCode}|${item.colorCode}`;
       const exist = existingCount.get(key) ?? 0;
       const shortage = item.qty - exist;
       
       if (shortage > 0) {
          const modelEntry = Object.values(MODELS).find((m) => m.code === item.modelCode);
          const colorEntry = COLORS.find((c) => c.code === item.colorCode);
          if (!modelEntry || !colorEntry) return;

          for (let i = 0; i < shortage; i++) {
             paddingCount++;
             const targetZoneId = activeZoneIds[paddingCount % activeZoneIds.length];
             const targetZone = updatedZones.find((z) => z.id === targetZoneId);
             if (!targetZone) continue;

             const laneIdx = paddingCount % targetZone.lanes.length;
             const lane = targetZone.lanes[laneIdx];

             const arrivedDate = new Date(
               2026,
               2 + Math.floor(rand() * 2),
               1 + Math.floor(rand() * 28),
               7 + Math.floor(rand() * 11),
             );
             const placedDate = new Date(
               arrivedDate.getTime() + (1 + Math.floor(rand() * 4)) * 24 * 3600 * 1000,
             );

             const history: any[] = [
               { ts: fmtTime(arrivedDate), from: "—", to: "RECV", note: "Xe nhập kho tự động bù hàng DDP" },
               { ts: fmtTime(placedDate), from: "RECV", to: `${targetZoneId}/${lane.label}`, note: "Sắp xếp vào zone" },
             ];

             const vin = nextVin();
             newVehicles.push({
               vin,
               modelName: modelEntry.name,
               modelCode: modelEntry.code,
               typeCode: modelEntry.type,
               optionCode: modelEntry.option,
               colorCode: colorEntry.code,
               colorName: colorEntry.name,
               colorHex: colorEntry.hex,
               arrivedAt: fmtTime(arrivedDate),
               status: "in_zone",
               zoneId: targetZoneId,
               laneId: lane.id,
               history,
             });
             
             lane.vehicleVins.push(vin);
             if (lane.vehicleVins.length > lane.capacity) {
               lane.capacity = lane.vehicleVins.length;
             }
             if (!targetZone.modelNames.includes(modelEntry.name)) {
               targetZone.modelNames.push(modelEntry.name);
             }
          }
          existingCount.set(key, exist + shortage);
       }
    });

    if (newVehicles.length > 0) {
       updatedZones.forEach(z => {
         const total = z.lanes.reduce((s, l) => s + l.capacity, 0);
         if (total > z.capacity) z.capacity = total;
       });
       setVehicles(prev => [...prev, ...newVehicles]);
       setZones(updatedZones);
    }
  }, [vehicles, zones]);

  const autoSelectAll = useCallback(
    (ddpId: string) => {
      const ddp = ddps.find((d) => d.id === ddpId);
      if (!ddp) return;
      
      ddp.items.forEach((item) => {
        if (item.selectedVins.length < item.qty) {
          autoSelect(ddpId, item.id);
        }
      });
    },
    [ddps, autoSelect]
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
    autoSelectAll,
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
