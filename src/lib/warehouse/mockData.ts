import type {
  DDP,
  HistoryEntry,
  Lane,
  SpecialArea,
  Vehicle,
  Zone,
} from "./types";

// ---------- Color palette (mã màu thực từ CSV Honda) ----------
export const COLORS: Array<{ code: string; name: string; hex: string }> = [
  { code: "NHA76", name: "Đen", hex: "#0a0a0a" },
  { code: "NHB18", name: "Đen nhám", hex: "#1f1f1f" },
  { code: "NHB25", name: "Xám đen", hex: "#3a3a3a" },
  { code: "NHB35", name: "Xám than", hex: "#2c2c2c" },
  { code: "NHB55", name: "Xám đậm", hex: "#4a4a4a" },
  { code: "NHC26", name: "Xám bạc", hex: "#9ca3af" },
  { code: "NHC34", name: "Bạc", hex: "#cbd5e1" },
  { code: "NHC35", name: "Xanh rêu", hex: "#4d7c0f" },
  { code: "NHC60", name: "Xám titan", hex: "#5a5a5a" },
  { code: "NHC75", name: "Xám đồng", hex: "#7a6a55" },
  { code: "NHD01", name: "Trắng", hex: "#fafafa" },
  { code: "NHD03", name: "Trắng kem", hex: "#fef9c3" },
  { code: "NHD14", name: "Trắng ngọc trai", hex: "#f5f5f5" },
  { code: "NH436", name: "Bạc nhám", hex: "#bfc3c7" },
  { code: "YR381", name: "Vàng", hex: "#facc15" },
  { code: "GY163", name: "Xám sáng", hex: "#a8a29e" },
  { code: "R350", name: "Đỏ tươi", hex: "#ef4444" },
  { code: "R368", name: "Đỏ Honda", hex: "#dc2626" },
  { code: "R389", name: "Đỏ rượu", hex: "#7f1d1d" },
  { code: "PB406", name: "Xanh dương nhạt", hex: "#60a5fa" },
  { code: "PB413", name: "Xanh navy", hex: "#1e40af" },
  { code: "PB421", name: "Xanh dương ngọc", hex: "#2563eb" },
  { code: "PB434", name: "Xanh dương đậm", hex: "#1e3a8a" },
];

// ---------- Models thật từ CSV Honda ----------
// Format đúng: MODEL_CODE + TYPE_CODE (vd: NSC110 K2CN), OPTION_CODE (vd: V02, có thể trống),
// COLOR_CODE (vd: R368). "option: """ nghĩa là option trống/full.
export const MODELS: Record<
  string,
  {
    code: string;
    name: string;
    type: string;
    option: string; // "" = trống/full
    colors: string[]; // các COLOR_CODE thực tế
  }
> = {
  NSC110_V02: {
    code: "NSC110 K2CN",
    name: "Vision",
    type: "V02",
    option: "",
    colors: ["YR381", "R368", "NHA76", "NHB18", "NHC60", "NHD01"],
  },
  NSC110_V06: {
    code: "NSC110 K2CN",
    name: "Vision",
    type: "V06",
    option: "",
    colors: ["YR381", "R368", "NHA76", "NHB18", "NHC60", "NHD01"],
  },
  ACA125_V01: {
    code: "ACA125 K3AG",
    name: "Air Blade 125",
    type: "V01",
    option: "",
    colors: ["NHB25", "R368", "NHA76", "NHC60", "NHD14", "PB434"],
  },
  AFS125_V01: {
    code: "AFS125 K73Y",
    name: "Air Blade 125 Sport",
    type: "V01",
    option: "",
    colors: ["NHC35", "NHC26", "PB421", "R350", "NHB55", "NHC34"],
  },
  FSH125_V01: {
    code: "FSH125 K1NG",
    name: "Future 125",
    type: "V01",
    option: "",
    colors: ["NHB18", "NHC60", "NHB35", "R368", "NHA76", "PB421"],
  },
  AFB110_V41: {
    code: "AFB110 K89Y",
    name: "Wave Alpha",
    type: "V41",
    option: "",
    colors: ["NHA76", "PB421", "R389", "NHB55", "NHC26"],
  },
  AFP110_V01: {
    code: "AFP110 K90P",
    name: "Wave RSX",
    type: "V01",
    option: "",
    colors: ["R368", "NHC60", "NHB25", "PB421"],
  },
  SH125_V05: {
    code: "SH125 K0RP",
    name: "SH 125",
    type: "V05",
    option: "",
    colors: ["NHD03", "NHD01", "NHC60", "NHD14", "NHB25"],
  },
  NHX125_V02: {
    code: "NHX125 K2TJ",
    name: "Lead 125",
    type: "V02",
    option: "",
    colors: ["NHA76", "NHC34", "NHD14", "NHB18"],
  },
  SH160_V01: {
    code: "SH160 K0SP",
    name: "SH 160",
    type: "V01",
    option: "",
    colors: ["NHC60", "NHD03", "NHD14", "NHD01", "GY163", "R368"],
  },
  ACA160_V01: {
    code: "ACA160 K2ZG",
    name: "Air Blade 160",
    type: "V01",
    option: "",
    colors: ["NHD14", "R368", "NHA76"],
  },
  FS150_V15: {
    code: "FS150 K2PN",
    name: "Winner X",
    type: "V15",
    option: "",
    colors: ["NHA76", "NHC60"],
  },
};

// ---------- Layout LOG2 ----------
// Phân bổ làn & sức chứa từng zone theo diện tích & hình dạng (dài/rộng) trong layout LOG2.
// Quy tắc:
//  - Zone NGẮN nhưng RỘNG (vd A12) → nhiều làn, ít xe/làn (vì làn ngắn).
//  - Zone DÀI nhưng HẸP (vd A13) → ít làn, nhiều xe/làn (vì làn dài).
//  - Tổng xe của mỗi zone là số chẵn.
const ZONE_PLAN: Array<{
  id: string;
  laneCount: number;
  laneCapacity: number; // sức chứa mỗi làn (đồng đều, đảm bảo capacity chẵn)
  models: string[];
  fillRatio: number;
  status: "normal" | "full" | "maintenance";
  maintenanceReason?: string;
  maintenanceStart?: string;
  maintenanceEnd?: string;
}> = [
  // Hàng dưới — A1 nhỏ, A2 dài & rộng nhất, A3 ngắn
  { id: "A1", laneCount: 4, laneCapacity: 12, models: ["NSC110_V02"], fillRatio: 0.78, status: "normal" }, // 48
  { id: "A2", laneCount: 5, laneCapacity: 20, models: ["NSC110_V06", "AFB110_V41"], fillRatio: 0.72, status: "normal" }, // 100
  { id: "A3", laneCount: 4, laneCapacity: 14, models: ["AFP110_V01"], fillRatio: 0.55, status: "normal" }, // 56
  // Hàng giữa dưới — A4 nhỏ, A5 lớn nhất (full), A6 vuông
  { id: "A4", laneCount: 4, laneCapacity: 12, models: ["FSH125_V01"], fillRatio: 0.85, status: "normal" }, // 48
  { id: "A5", laneCount: 5, laneCapacity: 20, models: ["ACA125_V01", "AFS125_V01"], fillRatio: 1.0, status: "full" }, // 100
  { id: "A6", laneCount: 4, laneCapacity: 14, models: ["NHX125_V02"], fillRatio: 0.6, status: "normal" }, // 56
  // Hàng giữa trên — A7 dài, A8 bảo trì, A9 nhỏ
  { id: "A7", laneCount: 4, laneCapacity: 18, models: ["SH125_V05", "SH160_V01"], fillRatio: 0.66, status: "normal" }, // 72
  { id: "A8", laneCount: 5, laneCapacity: 16, models: ["ACA160_V01"], fillRatio: 0, status: "maintenance",
    maintenanceReason: "Sửa nền & sơn lại vạch chia làn",
    maintenanceStart: "24/4/2026",
    maintenanceEnd: "29/4/2026",
  }, // 80
  { id: "A9", laneCount: 3, laneCapacity: 12, models: ["NHX125_V02"], fillRatio: 0.7, status: "normal" }, // 36
  // Hàng trên — A10 ngang, A11 ngang, A12 ngang vuông nhiều làn ngắn, A13 dọc dài
  { id: "A10", laneCount: 4, laneCapacity: 16, models: ["FS150_V15", "AFS125_V01"], fillRatio: 0.55, status: "normal" }, // 64
  { id: "A11", laneCount: 4, laneCapacity: 14, models: ["AFB110_V41"], fillRatio: 0.74, status: "normal" }, // 56
  { id: "A12", laneCount: 6, laneCapacity: 12, models: ["NSC110_V06"], fillRatio: 0.69, status: "normal" }, // 72 — nhiều làn, làn ngắn
  { id: "A13", laneCount: 5, laneCapacity: 18, models: ["SH125_V05", "ACA125_V01"], fillRatio: 0.62, status: "normal" }, // 90 — ít làn, làn dài
];

// ---------- pseudo-random deterministic ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rand = mulberry32(20260427);
export const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

export function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function fmtDate(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

let vinCounter = 50000;
export function nextVin() {
  vinCounter += 1;
  return `RLHPC00${vinCounter}`;
}

const vehicles: Vehicle[] = [];
const zones: Zone[] = [];

// ---------- All model keys for random picking ----------
const ALL_MODEL_KEYS = Object.keys(MODELS);

// Build zones, lanes, vehicles — MTOC lẫn lộn random, không gom theo zone
for (const plan of ZONE_PLAN) {
  const zoneId = plan.id;
  const laneCount = plan.laneCount;
  const capacity = laneCount * plan.laneCapacity;

  const lanes: Lane[] = [];
  const effectiveFill = plan.status === "maintenance" ? 0 : plan.fillRatio;

  for (let i = 0; i < laneCount; i++) {
    const targetLaneFill = Math.round(plan.laneCapacity * effectiveFill);
    const laneVins: string[] = [];

    // Pick a random primary model for lane metadata only
    const laneModelKey = ALL_MODEL_KEYS[Math.floor(rand() * ALL_MODEL_KEYS.length)];
    const laneModelDef = MODELS[laneModelKey];
    const lanePrimaryColorCode = laneModelDef.colors[Math.floor(rand() * laneModelDef.colors.length)];
    const lanePrimaryColor = COLORS.find((c) => c.code === lanePrimaryColorCode)!;

    for (let v = 0; v < targetLaneFill; v++) {
      // Mỗi xe pick random model + random màu từ toàn bộ catalog
      const useModelKey = ALL_MODEL_KEYS[Math.floor(rand() * ALL_MODEL_KEYS.length)];
      const useModel = MODELS[useModelKey];
      const useColorCode = useModel.colors[Math.floor(rand() * useModel.colors.length)];
      const useColor = COLORS.find((c) => c.code === useColorCode)!;

      const arrivedDate = new Date(
        2026,
        2 + Math.floor(rand() * 2),
        1 + Math.floor(rand() * 28),
        7 + Math.floor(rand() * 11),
      );
      const placedDate = new Date(
        arrivedDate.getTime() + (1 + Math.floor(rand() * 4)) * 24 * 3600 * 1000,
      );

      const history: HistoryEntry[] = [
        { ts: fmtTime(arrivedDate), from: "—", to: "RECV", note: "Xe nhập kho từ nhà máy Honda VN" },
        { ts: fmtTime(placedDate), from: "RECV", to: `${zoneId}/L${i + 1}`, note: "Sắp xếp vào zone" },
      ];

      if (rand() < 0.15) {
        const otherIdx = ((parseInt(zoneId.slice(1)) % 13) + 1);
        const otherZone = `A${otherIdx}`;
        const movedDate = new Date(placedDate.getTime() + (2 + Math.floor(rand() * 6)) * 24 * 3600 * 1000);
        history[1] = {
          ts: fmtTime(placedDate),
          from: "RECV",
          to: `${otherZone}/L${1 + Math.floor(rand() * 3)}`,
          note: "Sắp xếp vào zone ban đầu",
        };
        history.push({
          ts: fmtTime(movedDate),
          from: history[1].to,
          to: `${zoneId}/L${i + 1}`,
          note: "Dồn kho — chuyển vị trí",
        });
      }

      if (rand() < 0.12) {
        const last = history[history.length - 1].to;
        const ngDate = new Date(placedDate.getTime() + 24 * 3600 * 1000);
        const fixDate = new Date(ngDate.getTime() + 2 * 24 * 3600 * 1000);
        const okDate = new Date(fixDate.getTime() + 18 * 3600 * 1000);
        const backDate = new Date(okDate.getTime() + 4 * 3600 * 1000);
        history.push(
          { ts: fmtTime(ngDate), from: last, to: "Kho Check (NG)", note: "Phát hiện lỗi ngoại quan (xước/móp)" },
          { ts: fmtTime(fixDate), from: "Kho Check (NG)", to: "Nhà máy bảo dưỡng", note: "Chuyển nhà máy sửa chữa" },
          { ts: fmtTime(okDate), from: "Nhà máy bảo dưỡng", to: "QC", note: "Sửa OK — qua QC kiểm tra cuối" },
          { ts: fmtTime(backDate), from: "QC", to: `${zoneId}/L${i + 1}`, note: "Đạt QC — trả lại layout" },
        );
      }

      if (rand() < 0.05 && zoneId !== "A8") {
        const moveDate = new Date(placedDate.getTime() + 36 * 3600 * 1000);
        history.push({
          ts: fmtTime(moveDate),
          from: history[history.length - 1].to,
          to: `${zoneId}/L${i + 1}`,
          note: "Chuyển từ A8 do A8 đang bảo trì nền/sơn",
        });
      }

      const vin = nextVin();
      vehicles.push({
        vin,
        modelName: useModel.name,
        modelCode: useModel.code,
        typeCode: useModel.type,
        optionCode: useModel.option,
        colorCode: useColor.code,
        colorName: useColor.name,
        colorHex: useColor.hex,
        arrivedAt: fmtTime(arrivedDate),
        status: "in_zone",
        zoneId,
        laneId: `${zoneId}-L${i + 1}`,
        history,
      });
      laneVins.push(vin);
    }

    lanes.push({
      id: `${zoneId}-L${i + 1}`,
      label: `L${i + 1}`,
      capacity: plan.laneCapacity,
      primaryModelCode: laneModelDef.code,
      primaryColorCode: lanePrimaryColor.code,
      vehicleVins: laneVins,
    });
  }

  // Collect unique model names present in this zone's vehicles
  const zoneModelNames = Array.from(new Set(
    vehicles.filter(vv => vv.zoneId === zoneId).map(vv => vv.modelName)
  ));

  zones.push({
    id: zoneId,
    label: zoneId,
    capacity,
    lanes,
    modelNames: zoneModelNames.length > 0 ? zoneModelNames : plan.models.map((k) => MODELS[k].name),
    status: plan.status,
    maintenanceReason: plan.maintenanceReason,
    maintenanceStart: plan.maintenanceStart,
    maintenanceEnd: plan.maintenanceEnd,
  });
}

// ---------- Ensure enough inventory for DDP orders ----------
// Count current vehicles in layout per modelCode+colorCode, compare with DDP requirements,
// and add extra vehicles if the inventory is short. This keeps mock data realistic.
const DDP_REQUIREMENTS: Array<{ modelKey: string; colorCode: string; qty: number }> = [
  // DDP-NKV-001
  { modelKey: "NSC110_V02", colorCode: "YR381", qty: 14 },
  { modelKey: "NSC110_V06", colorCode: "NHA76", qty: 12 },
  { modelKey: "AFB110_V41", colorCode: "PB421", qty: 12 },
  { modelKey: "SH125_V05", colorCode: "NHD03", qty: 12 },
  // DDP-PA-002
  { modelKey: "ACA125_V01", colorCode: "NHB25", qty: 12 },
  { modelKey: "AFS125_V01", colorCode: "NHC35", qty: 10 },
  { modelKey: "FSH125_V01", colorCode: "NHB18", qty: 10 },
  { modelKey: "NHX125_V02", colorCode: "NHA76", qty: 8 },
  // DDP-VTC-003
  { modelKey: "SH160_V01", colorCode: "NHC60", qty: 8 },
  { modelKey: "FS150_V15", colorCode: "NHA76", qty: 8 },
  { modelKey: "ACA160_V01", colorCode: "NHD14", qty: 6 },
  { modelKey: "AFP110_V01", colorCode: "R368", qty: 6 },
  // DDP-VJC-004
  { modelKey: "NSC110_V06", colorCode: "R368", qty: 16 },
  { modelKey: "SH125_V05", colorCode: "NHD01", qty: 12 },
  { modelKey: "ACA125_V01", colorCode: "R368", qty: 12 },
  // DDP-DRG-005
  { modelKey: "FSH125_V01", colorCode: "NHC60", qty: 16 },
  { modelKey: "AFB110_V41", colorCode: "NHA76", qty: 18 },
  { modelKey: "AFS125_V01", colorCode: "PB421", qty: 16 },
];

// Aggregate total needed per modelCode+colorCode across all DDPs
const neededMap = new Map<string, number>();
DDP_REQUIREMENTS.forEach((r) => {
  const key = `${MODELS[r.modelKey].code}|${r.colorCode}`;
  neededMap.set(key, (neededMap.get(key) ?? 0) + r.qty);
});

// Count existing in-zone vehicles
const existingCount = new Map<string, number>();
vehicles.forEach((v) => {
  if (v.status === "in_zone") {
    const key = `${v.modelCode}|${v.colorCode}`;
    existingCount.set(key, (existingCount.get(key) ?? 0) + 1);
  }
});

// Add extra vehicles where inventory is short (with a small buffer of +2)
const activeZoneIds = ZONE_PLAN.filter((p) => p.status !== "maintenance").map((p) => p.id);
neededMap.forEach((needed, key) => {
  const existing = existingCount.get(key) ?? 0;
  const shortage = needed + 2 - existing; // +2 buffer so there's a little extra
  if (shortage <= 0) return;

  const [modelCode, colorCode] = key.split("|");
  const modelEntry = Object.values(MODELS).find((m) => m.code === modelCode);
  if (!modelEntry) return;
  const colorEntry = COLORS.find((c) => c.code === colorCode);
  if (!colorEntry) return;

  for (let i = 0; i < shortage; i++) {
    // Distribute among active zones round-robin
    const targetZoneId = activeZoneIds[i % activeZoneIds.length];
    const targetZone = zones.find((z) => z.id === targetZoneId);
    if (!targetZone) continue;

    // Pick a lane in this zone (round-robin)
    const laneIdx = i % targetZone.lanes.length;
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

    const history: HistoryEntry[] = [
      { ts: fmtTime(arrivedDate), from: "—", to: "RECV", note: "Xe nhập kho từ nhà máy Honda VN" },
      { ts: fmtTime(placedDate), from: "RECV", to: `${targetZoneId}/${lane.label}`, note: "Sắp xếp vào zone" },
    ];

    const vin = nextVin();
    vehicles.push({
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
  }
});

// Update zone capacities to match expanded lane capacities
zones.forEach((z) => {
  const totalLanesCap = z.lanes.reduce((sum, l) => sum + l.capacity, 0);
  if (totalLanesCap > z.capacity) {
    z.capacity = totalLanesCap;
  }
});

// Re-compute modelNames for zones after adding extra vehicles
zones.forEach((z) => {
  const zoneModelNames = Array.from(new Set(
    vehicles.filter((vv) => vv.zoneId === z.id).map((vv) => vv.modelName),
  ));
  if (zoneModelNames.length > 0) z.modelNames = zoneModelNames;
});

// ---------- Special areas ----------
function makeSpecialVehicle(status: Vehicle["status"]): Vehicle {
  const modelKey = pick(Object.keys(MODELS));
  const model = MODELS[modelKey];
  const colorCode = pick(model.colors);
  const c = COLORS.find((cc) => cc.code === colorCode)!;
  const arrived = new Date(
    2026,
    2 + Math.floor(rand() * 2),
    1 + Math.floor(rand() * 28),
    8 + Math.floor(rand() * 10),
  );
  const history: HistoryEntry[] = [
    { ts: fmtTime(arrived), from: "—", to: "RECV", note: "Xe nhập kho từ nhà máy Honda VN" },
  ];
  if (status === "in_ng") {
    const t = new Date(arrived.getTime() + 24 * 3600 * 1000);
    history.push({
      ts: fmtTime(t),
      from: "RECV",
      to: "Kho Check (NG)",
      note: "Phát hiện lỗi ngoại quan khi kiểm tra đầu vào",
    });
  } else if (status === "in_maintenance") {
    const t1 = new Date(arrived.getTime() + 24 * 3600 * 1000);
    const t2 = new Date(t1.getTime() + 24 * 3600 * 1000);
    history.push(
      { ts: fmtTime(t1), from: "RECV", to: "Kho Check (NG)", note: "Phát hiện lỗi ngoại quan" },
      { ts: fmtTime(t2), from: "Kho Check (NG)", to: "Nhà máy bảo dưỡng", note: "Chuyển nhà máy sửa lỗi" },
    );
  }
  return {
    vin: nextVin(),
    modelName: model.name,
    modelCode: model.code,
    typeCode: model.type,
    optionCode: model.option,
    colorCode: c.code,
    colorName: c.name,
    colorHex: c.hex,
    arrivedAt: fmtTime(arrived),
    status,
    history,
  };
}

const ngCount = 18;
const maintCount = 9;
const recvCount = 32;
for (let i = 0; i < ngCount; i++) vehicles.push(makeSpecialVehicle("in_ng"));
for (let i = 0; i < maintCount; i++) vehicles.push(makeSpecialVehicle("in_maintenance"));
for (let i = 0; i < recvCount; i++) vehicles.push(makeSpecialVehicle("in_receiving"));

const specialAreas: SpecialArea[] = [
  {
    id: "NG",
    label: "Kho Check",
    shortDesc: "Xe đang chờ kiểm tra ngoại quan",
    longDesc:
      "Khu (NG zone) giữ tạm xe có lỗi bề mặt (xước, trầy, móp). Sau khi xác nhận sẽ chuyển sang Nhà máy bảo dưỡng để sửa, sửa xong qua QC rồi quay lại layout.",
    count: ngCount,
    capacity: ngCount,
  },
  {
    id: "MAINT",
    label: "Nhà máy bảo dưỡng",
    shortDesc: "Đang sửa lỗi ngoại quan",
    longDesc:
      "Xe đang được sửa các lỗi bề mặt. Sau khi đạt QC sẽ được chuyển trở lại layout đúng zone theo MTOC.",
    count: maintCount,
    capacity: maintCount,
  },
  {
    id: "RECV",
    label: "Receiving Area",
    shortDesc: "Mới nhập kho, chờ kiểm tra",
    longDesc:
      "Khu nhận xe từ nhà máy. Sau khi kiểm tra ngoại quan, xe OK vào layout, xe lỗi chuyển sang Kho Check.",
    count: recvCount,
    capacity: recvCount,
  },
];

// ---------- DDP plans ----------
// Chỉ build dòng MTOC nếu trong layout TỒN TẠI ít nhất 1 xe khớp (model + màu).
// → Đảm bảo "không bao giờ" gặp trường hợp không có gợi ý.
function findZoneForMTOC(modelCode: string, colorCode: string): string | undefined {
  // Ưu tiên zone có đúng MTOC (model + color)
  const exact = vehicles.find(
    (vv) => vv.status === "in_zone" && vv.modelCode === modelCode && vv.colorCode === colorCode,
  );
  if (exact?.zoneId) return exact.zoneId;
  // Fallback: zone bất kỳ có model này (giữ MTOC trong đơn — tránh bị cắt)
  const sameModel = vehicles.find(
    (vv) => vv.status === "in_zone" && vv.modelCode === modelCode,
  );
  return sameModel?.zoneId;
}

interface DDPItemSpec {
  modelKey: string;
  colorCode: string;
  qty: number;
}
function buildDDP(
  id: string,
  carrier: string,
  carrierCode: string,
  status: DDP["status"],
  date: string,
  itemSpecs: DDPItemSpec[],
): DDP {
  const items = itemSpecs
    .map((spec, idx) => {
      const m = MODELS[spec.modelKey];
      const color = COLORS.find((c) => c.code === spec.colorCode);
      if (!color) return null;
      const suggestedZoneId = findZoneForMTOC(m.code, color.code);
      if (!suggestedZoneId) return null; // bỏ MTOC không có xe trong layout
      // Giữ nguyên qty yêu cầu của đơn hàng (không cắt theo tồn kho).
      // Gợi ý xe vẫn được tìm đầy đủ trong layout (đảm bảo có suggestedZoneId).
      const qty = spec.qty;
      if (qty <= 0) return null;
      return {
        id: `${id}-line-${idx}`,
        modelName: m.name,
        modelCode: m.code,
        typeCode: m.type,
        optionCode: m.option,
        colorCode: color.code,
        colorName: color.name,
        colorHex: color.hex,
        qty,
        suggestedZoneId,
        selectedVins: [] as string[],
      };
    })
    .filter((it): it is NonNullable<typeof it> => it !== null);
  const totalQty = items.reduce((s, it) => s + it.qty, 0);
  return { id, carrier, carrierCode, createdAt: date, status, totalQty, items };
}

// Carrier thật: NKV (NKV LOGISTICS LTD), VETRANCO_S, VIJACO_S, PHUONGANH, VIJACO_N, DRAGON_S
const ddps: DDP[] = [
  // 50 xe
  buildDDP(
    "DDP-NKV-001",
    "NKV LOGISTICS LTD (Công ty TNHH Dịch Vụ Tiếp Vận NKV)",
    "NKV",
    "processing",
    "27/4/2026",
    [
      { modelKey: "NSC110_V02", colorCode: "YR381", qty: 14 },
      { modelKey: "NSC110_V06", colorCode: "NHA76", qty: 12 },
      { modelKey: "AFB110_V41", colorCode: "PB421", qty: 12 },
      { modelKey: "SH125_V05", colorCode: "NHD03", qty: 12 },
    ],
  ),
  // 40 xe
  buildDDP("DDP-PA-002", "Phương Anh Logistics", "PHUONGANH", "waiting", "27/4/2026", [
    { modelKey: "ACA125_V01", colorCode: "NHB25", qty: 12 },
    { modelKey: "AFS125_V01", colorCode: "NHC35", qty: 10 },
    { modelKey: "FSH125_V01", colorCode: "NHB18", qty: 10 },
    { modelKey: "NHX125_V02", colorCode: "NHA76", qty: 8 },
  ]),
  // 28 xe
  buildDDP("DDP-VTC-003", "Vetranco South", "VETRANCO_S", "waiting", "27/4/2026", [
    { modelKey: "SH160_V01", colorCode: "NHC60", qty: 8 },
    { modelKey: "FS150_V15", colorCode: "NHA76", qty: 8 },
    { modelKey: "ACA160_V01", colorCode: "NHD14", qty: 6 },
    { modelKey: "AFP110_V01", colorCode: "R368", qty: 6 },
  ]),
  // 40 xe
  buildDDP("DDP-VJC-004", "Vijaco South", "VIJACO_S", "waiting", "27/4/2026", [
    { modelKey: "NSC110_V06", colorCode: "R368", qty: 16 },
    { modelKey: "SH125_V05", colorCode: "NHD01", qty: 12 },
    { modelKey: "ACA125_V01", colorCode: "R368", qty: 12 },
  ]),
  // 50 xe
  buildDDP("DDP-DRG-005", "Dragon South", "DRAGON_S", "waiting", "27/4/2026", [
    { modelKey: "FSH125_V01", colorCode: "NHC60", qty: 16 },
    { modelKey: "AFB110_V41", colorCode: "NHA76", qty: 18 },
    { modelKey: "AFS125_V01", colorCode: "PB421", qty: 16 },
  ]),
];

// ---------- Public API ----------
export const initialZones: Zone[] = zones;
export const initialVehicles: Vehicle[] = vehicles;
export const initialDDPs: DDP[] = ddps;
export const initialSpecialAreas: SpecialArea[] = specialAreas;

export const totalCapacity = zones.reduce((s, z) => s + z.capacity, 0);
export const totalInLayout = vehicles.filter((v) => v.status === "in_zone").length;

export function getVehicleByVin(vin: string): Vehicle | undefined {
  return vehicles.find((v) => v.vin === vin);
}

export function lookupColor(code: string): { code: string; name: string; hex: string } | undefined {
  return COLORS.find((c) => c.code === code);
}

export function findZoneForVehicleType(
  vehicleList: Vehicle[],
  modelCode: string,
  colorCode: string,
): string | undefined {
  // Đếm xe trong layout theo từng zone, trả zone có nhiều xe khớp nhất
  const counts = new Map<string, number>();
  vehicleList.forEach((v) => {
    if (v.status === "in_zone" && v.modelCode === modelCode && v.colorCode === colorCode && v.zoneId) {
      counts.set(v.zoneId, (counts.get(v.zoneId) ?? 0) + 1);
    }
  });
  let best: string | undefined;
  let max = 0;
  counts.forEach((n, z) => {
    if (n > max) {
      max = n;
      best = z;
    }
  });
  return best;
}

export { fmtDate };
