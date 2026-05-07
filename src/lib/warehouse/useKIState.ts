import { useCallback, useState } from "react";
import type {
  KIFrameRecord,
  KILocationCount,
  KIPeriod,
  KiemTraThucDiaItem,
  KISnapshot,
  KISnapshotItem,
  PhieuKiemKe,
  PhuLucDieuChinh,
  Vehicle,
  VehicleStatus,
} from "./types";

const COUNTABLE_STATUSES = new Set<VehicleStatus>([
  "in_zone",
  "in_ng",
  "in_maintenance",
  "in_receiving",
]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtTimestamp(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(
    d.getMonth() + 1,
  )}/${d.getFullYear()}`;
}

function dateStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`;
}

function periodLabel(period: KIPeriod, d: Date): string {
  if (period === "MONTH") return `Kỳ cuối tháng ${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (period === "YEAR") return `Kỳ cuối năm ${d.getFullYear()}`;
  return `Kỳ cuối ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function locationOf(v: Vehicle): string {
  if (v.status === "in_zone") {
    const lane = v.laneId?.split("-").pop();
    return v.zoneId ? `${v.zoneId}${lane ? `/${lane}` : ""}` : "Layout";
  }
  if (v.status === "in_ng") return "Kho Check (NG)";
  if (v.status === "in_maintenance") return "Nhà máy bảo dưỡng";
  if (v.status === "in_receiving") return "Receiving";
  return "Đã xuất";
}

function mtocKeyOf(v: Vehicle): string {
  return [v.modelCode, v.typeCode, v.optionCode, v.colorCode].join("|");
}

function sortLocationCounts(counts: Map<string, number>): KILocationCount[] {
  return Array.from(counts.entries())
    .map(([location, qty]) => ({ location, qty }))
    .sort((a, b) => b.qty - a.qty || a.location.localeCompare(b.location));
}

function zoneFromLocation(location: string): string {
  return location.includes("/") ? location.split("/")[0] : location;
}

function blockLabelOf(item: KISnapshotItem): string {
  const blocks = Array.from(
    new Set(item.locationCounts.map((loc) => zoneFromLocation(loc.location))),
  );
  if (blocks.length === 0) return "-";
  if (blocks.length === 1) return blocks[0];
  return `${blocks[0]} + ${blocks.length - 1} khu vực`;
}

function buildSnapshot(vehicles: Vehicle[]): KISnapshot {
  const now = new Date();
  const groups = new Map<
    string,
    {
      sample: Vehicle;
      frames: KIFrameRecord[];
      locations: Map<string, number>;
    }
  >();

  vehicles.forEach((vehicle) => {
    if (!COUNTABLE_STATUSES.has(vehicle.status)) return;

    const key = mtocKeyOf(vehicle);
    const location = locationOf(vehicle);
    const group = groups.get(key) ?? {
      sample: vehicle,
      frames: [],
      locations: new Map<string, number>(),
    };

    const lastHistoryAt = vehicle.history.at(-1)?.ts ?? vehicle.arrivedAt;
    group.frames.push({
      vin: vehicle.vin,
      status: vehicle.status,
      location,
      zoneId: vehicle.zoneId,
      laneId: vehicle.laneId,
      arrivedAt: vehicle.arrivedAt,
      lastHistoryAt,
    });
    group.locations.set(location, (group.locations.get(location) ?? 0) + 1);
    groups.set(key, group);
  });

  const items: KISnapshotItem[] = Array.from(groups.entries()).map(([mtocKey, group]) => {
    const locationCounts = sortLocationCounts(group.locations);
    const frames = [...group.frames].sort(
      (a, b) => a.location.localeCompare(b.location) || a.vin.localeCompare(b.vin),
    );

    return {
      mtocKey,
      modelCode: group.sample.modelCode,
      modelName: group.sample.modelName,
      typeCode: group.sample.typeCode,
      optionCode: group.sample.optionCode,
      colorCode: group.sample.colorCode,
      colorName: group.sample.colorName,
      colorHex: group.sample.colorHex,
      primaryLocation: locationCounts[0]?.location ?? "-",
      locationCounts,
      frameRecords: frames,
      frameNumbers: frames.map((f) => f.vin),
      qty: frames.length,
    };
  });

  items.sort(
    (a, b) =>
      a.modelName.localeCompare(b.modelName) ||
      a.modelCode.localeCompare(b.modelCode) ||
      a.typeCode.localeCompare(b.typeCode) ||
      a.optionCode.localeCompare(b.optionCode) ||
      a.colorCode.localeCompare(b.colorCode),
  );

  return {
    id: `KI-${dateStamp(now)}`,
    createdAt: fmtTimestamp(now),
    period: "DAY",
    periodLabel: `Đợt kiểm kê ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
    totalQty: items.reduce((sum, item) => sum + item.qty, 0),
    items,
  };
}

function draftStatusFor(phieu: PhieuKiemKe): PhieuKiemKe["status"] {
  return phieu.inspectionList.length > 0 ? "DANG_KIEM_TRA" : "CHUA_KIEM_TRA";
}

function buildPhieu(snapshot: KISnapshot, item: KISnapshotItem, index: number): PhieuKiemKe {
  return {
    phieuNo: `${snapshot.id}-${String(index + 1).padStart(3, "0")}`,
    snapshotId: snapshot.id,
    mtocKey: item.mtocKey,
    modelCode: item.modelCode,
    modelName: item.modelName,
    typeCode: item.typeCode,
    optionCode: item.optionCode,
    colorCode: item.colorCode,
    colorName: item.colorName,
    colorHex: item.colorHex,
    primaryLocation: item.primaryLocation,
    locationCounts: item.locationCounts,
    frameRecords: item.frameRecords,
    frameNumbers: item.frameNumbers,
    maBlock: blockLabelOf(item),
    systemQty: item.qty,
    nguoiDem: "",
    nguoiXacNhan: "",
    auditorName: "",
    soLuongThanhTra: null,
    inspectionList: [],
    adjustmentAppendix: null,
    note: "",
    status: "CHUA_KIEM_TRA",
    createdAt: snapshot.createdAt,
    confirmedAt: null,
  };
}

function normalizeDraftPhieu(phieu: PhieuKiemKe): PhieuKiemKe {
  if (phieu.status === "DA_CHOT") return phieu;
  return {
    ...phieu,
    status: draftStatusFor(phieu),
  };
}

function frameRecordFromVehicle(vehicle: Vehicle): KIFrameRecord {
  return {
    vin: vehicle.vin,
    status: vehicle.status,
    location: locationOf(vehicle),
    zoneId: vehicle.zoneId,
    laneId: vehicle.laneId,
    arrivedAt: vehicle.arrivedAt,
    lastHistoryAt: vehicle.history.at(-1)?.ts ?? vehicle.arrivedAt,
  };
}

function buildInspectionItem(
  vin: string,
  currentVehicle: Vehicle | null,
  expectedFrame: KIFrameRecord | undefined,
  previous?: KiemTraThucDiaItem,
): KiemTraThucDiaItem {
  const liveFrame = currentVehicle ? frameRecordFromVehicle(currentVehicle) : null;
  return {
    vin,
    systemFound: Boolean(liveFrame),
    belongsToPhieu: Boolean(expectedFrame),
    expectedLocation: expectedFrame?.location ?? null,
    currentLocation: liveFrame?.location ?? null,
    zoneId: liveFrame?.zoneId,
    laneId: liveFrame?.laneId,
    currentStatus: liveFrame?.status ?? null,
    arrivedAt: liveFrame?.arrivedAt ?? expectedFrame?.arrivedAt ?? null,
    lastHistoryAt: liveFrame?.lastHistoryAt ?? expectedFrame?.lastHistoryAt ?? null,
    ketQua: previous?.ketQua ?? null,
    ghiChu: previous?.ghiChu ?? "",
    checkedAt: previous?.checkedAt ?? null,
  };
}

function validAppendix(appendix: PhuLucDieuChinh | null): boolean {
  if (!appendix) return true;
  return appendix.soLuong > 0 && appendix.lyDo.trim().length > 0 && appendix.nguoiLap.trim().length > 0;
}

export function useKIState() {
  const [kiMode, setKiMode] = useState(false);
  const [kiSnapshot, setKiSnapshot] = useState<KISnapshot | null>(null);
  const [phieuList, setPhieuList] = useState<PhieuKiemKe[]>([]);

  const startKI = useCallback((vehicles: Vehicle[]) => {
    const snapshot = buildSnapshot(vehicles);
    setKiSnapshot(snapshot);
    setPhieuList([]);
    setKiMode(true);
  }, []);

  const endKI = useCallback(() => {
    setKiMode(false);
  }, []);

  const createPhieu = useCallback(
    (mtocKey: string) => {
      if (!kiSnapshot) return;
      setPhieuList((prev) => {
        if (prev.some((phieu) => phieu.mtocKey === mtocKey)) return prev;
        const item = kiSnapshot.items.find((candidate) => candidate.mtocKey === mtocKey);
        if (!item) return prev;
        return [...prev, buildPhieu(kiSnapshot, item, prev.length)];
      });
    },
    [kiSnapshot],
  );

  const createAllPhieu = useCallback(() => {
    if (!kiSnapshot) return;
    setPhieuList((prev) => {
      const existing = new Set(prev.map((phieu) => phieu.mtocKey));
      const next = [...prev];
      kiSnapshot.items.forEach((item) => {
        if (!existing.has(item.mtocKey)) {
          next.push(buildPhieu(kiSnapshot, item, next.length));
          existing.add(item.mtocKey);
        }
      });
      return next;
    });
  }, [kiSnapshot]);

  const updatePhieuField = useCallback(
    (
      phieuNo: string,
      updates: Partial<
        Pick<
          PhieuKiemKe,
          "nguoiDem" | "nguoiXacNhan" | "auditorName" | "note" | "soLuongThanhTra"
        >
      >,
    ) => {
      setPhieuList((prev) =>
        prev.map((phieu) =>
          phieu.phieuNo === phieuNo && phieu.status !== "DA_CHOT"
            ? normalizeDraftPhieu({ ...phieu, ...updates })
            : phieu,
        ),
      );
    },
    [],
  );

  const addInspectionVin = useCallback((phieuNo: string, vin: string, currentVehicle: Vehicle | null) => {
    const normalizedVin = vin.trim().toUpperCase();
    if (!normalizedVin) return;

    setPhieuList((prev) =>
      prev.map((phieu) => {
        if (phieu.phieuNo !== phieuNo || phieu.status === "DA_CHOT") return phieu;

        const expectedFrame = phieu.frameRecords.find((item) => item.vin === normalizedVin);
        const current = phieu.inspectionList.find((item) => item.vin === normalizedVin);
        const nextItem = buildInspectionItem(normalizedVin, currentVehicle, expectedFrame, current);

        const rest = phieu.inspectionList.filter((item) => item.vin !== normalizedVin);
        return normalizeDraftPhieu({
          ...phieu,
          inspectionList: [...rest, nextItem].sort(
            (a, b) =>
              (a.currentLocation ?? a.expectedLocation ?? "").localeCompare(
                b.currentLocation ?? b.expectedLocation ?? "",
              ) || a.vin.localeCompare(b.vin),
          ),
        });
      }),
    );
  }, []);

  const removeInspectionVin = useCallback((phieuNo: string, vin: string) => {
    setPhieuList((prev) =>
      prev.map((phieu) => {
        if (phieu.phieuNo !== phieuNo || phieu.status === "DA_CHOT") return phieu;
        return normalizeDraftPhieu({
          ...phieu,
          inspectionList: phieu.inspectionList.filter((item) => item.vin !== vin),
        });
      }),
    );
  }, []);

  const updateInspectionResult = useCallback(
    (phieuNo: string, vin: string, ketQua: KiemTraThucDiaItem["ketQua"], ghiChu: string) => {
      setPhieuList((prev) =>
        prev.map((phieu) => {
          if (phieu.phieuNo !== phieuNo || phieu.status === "DA_CHOT") return phieu;
          return normalizeDraftPhieu({
            ...phieu,
            inspectionList: phieu.inspectionList.map((item) =>
              item.vin === vin
                ? {
                    ...item,
                    ketQua,
                    ghiChu,
                    checkedAt: ketQua ? fmtTimestamp(new Date()) : null,
                  }
                : item,
            ),
          });
        }),
      );
    },
    [],
  );

  const saveAdjustmentAppendix = useCallback(
    (
      phieuNo: string,
      appendix: Omit<PhuLucDieuChinh, "createdAt" | "soLuongSauDieuChinh"> | null,
    ) => {
      setPhieuList((prev) =>
        prev.map((phieu) => {
          if (phieu.phieuNo !== phieuNo || phieu.status === "DA_CHOT") return phieu;
          if (!appendix || appendix.soLuong <= 0) {
            return normalizeDraftPhieu({
              ...phieu,
              adjustmentAppendix: null,
            });
          }

          const signedQty = appendix.loaiChenhLech === "THUA" ? appendix.soLuong : -appendix.soLuong;
          return normalizeDraftPhieu({
            ...phieu,
            adjustmentAppendix: {
              ...appendix,
              createdAt: fmtTimestamp(new Date()),
              soLuongSauDieuChinh: phieu.systemQty + signedQty,
            },
          });
        }),
      );
    },
    [],
  );

  const confirmPhieu = useCallback((phieuNo: string) => {
    setPhieuList((prev) =>
      prev.map((phieu) => {
        if (phieu.phieuNo !== phieuNo || phieu.status === "DA_CHOT") return phieu;

        const coDuMauThanhTra = phieu.inspectionList.length >= 10;
        const coXeChuaDanhDau = phieu.inspectionList.some((item) => item.ketQua === null);
        const ketQuaOk =
          phieu.soLuongThanhTra === phieu.systemQty &&
          phieu.inspectionList.length >= 10 &&
          phieu.inspectionList.every(
            (item) =>
              item.ketQua === "KHOP" &&
              item.systemFound &&
              item.belongsToPhieu,
          );

        if (!coDuMauThanhTra || coXeChuaDanhDau) return phieu;
        if (!ketQuaOk && !validAppendix(phieu.adjustmentAppendix)) return phieu;

        return {
          ...phieu,
          status: "DA_CHOT" as const,
          confirmedAt: fmtTimestamp(new Date()),
        };
      }),
    );
  }, []);

  return {
    kiMode,
    kiSnapshot,
    phieuList,
    startKI,
    endKI,
    createPhieu,
    createAllPhieu,
    updatePhieuField,
    addInspectionVin,
    removeInspectionVin,
    updateInspectionResult,
    saveAdjustmentAppendix,
    confirmPhieu,
  };
}

export type KIState = ReturnType<typeof useKIState>;
