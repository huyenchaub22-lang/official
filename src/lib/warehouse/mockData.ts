import type {
  DDP,
  HistoryEntry,
  Lane,
  SpecialArea,
  Vehicle,
  Zone,
} from "./types";

// ---------- Color palette ----------
export const COLORS: Array<{
  code: string;
  name: string;
  hex: string;
}> = [
  { code: "NHB18", name: "Đen nhám", hex: "#1f1f1f" },
  { code: "NHA76", name: "Đen", hex: "#0a0a0a" },
  { code: "V20", name: "Xám đen", hex: "#3a3a3a" },
  { code: "V05", name: "Trắng", hex: "#f5f5f5" },
  { code: "V23", name: "Trắng ngọc", hex: "#fafafa" },
  { code: "YR381", name: "Vàng", hex: "#facc15" },
  { code: "R322", name: "Đỏ", hex: "#dc2626" },
  { code: "B603", name: "Xanh dương", hex: "#2563eb" },
  { code: "B521", name: "Xanh ngọc", hex: "#06b6d4" },
  { code: "G401", name: "Xanh lá", hex: "#16a34a" },
];

// ---------- Models per zone (matches the screenshot distribution) ----------
const ZONE_MODEL_PLAN: Array<{
  id: string;
  capacity: number;
  models: Array<{ code: string; name: string; type: string; option: string }>;
}> = [
  {
    id: "Z01",
    capacity: 70,
    models: [{ code: "NSC110", name: "Vision", type: "K2CN", option: "V00" }],
  },
  {
    id: "Z02",
    capacity: 65,
    models: [{ code: "WAV110", name: "Wave Alpha", type: "K1CN", option: "V01" }],
  },
  {
    id: "Z03",
    capacity: 70,
    models: [
      { code: "SH125", name: "SH 125", type: "K3SH", option: "V02" },
      { code: "FUT125", name: "Future 125", type: "K2FU", option: "V03" },
    ],
  },
  {
    id: "Z04",
    capacity: 70,
    models: [{ code: "ACA125", name: "Air Blade 125", type: "K3AG", option: "V00" }],
  },
  {
    id: "Z05",
    capacity: 56,
    models: [
      { code: "NHX125", name: "Lead 125", type: "K2TJ", option: "V05" },
      { code: "WIN150", name: "Winner X", type: "K1WX", option: "V07" },
    ],
  },
  {
    id: "Z06",
    capacity: 56,
    models: [
      { code: "SH125", name: "SH 125", type: "K3SH", option: "V02" },
      { code: "WAV125", name: "Wave RSX", type: "K1RS", option: "V04" },
    ],
  },
  {
    id: "Z07",
    capacity: 56,
    models: [{ code: "SH160", name: "SH 160", type: "K3SI", option: "V08" }],
  },
  {
    id: "Z08",
    capacity: 65,
    models: [
      { code: "WIN150", name: "Winner X", type: "K1WX", option: "V07" },
      { code: "ACA160", name: "Air Blade 160", type: "K3AB", option: "V09" },
    ],
  },
  {
    id: "Z09",
    capacity: 70,
    models: [
      { code: "NSC110", name: "Vision", type: "K2CN", option: "V00" },
      { code: "WAV125", name: "Wave RSX", type: "K1RS", option: "V04" },
    ],
  },
  {
    id: "Z10",
    capacity: 52,
    models: [{ code: "FSH125", name: "Future Sport", type: "K1NG", option: "V02" }],
  },
  {
    id: "Z11",
    capacity: 65,
    models: [
      { code: "FUT125", name: "Future 125", type: "K2FU", option: "V03" },
      { code: "ACA125", name: "Air Blade 125", type: "K3AG", option: "V00" },
    ],
  },
];

// Each zone has 4-5 lanes; lanes group same-characteristic vehicles
const LANES_PER_ZONE: Record<string, number> = {
  Z01: 5,
  Z02: 5,
  Z03: 5,
  Z04: 5,
  Z05: 4,
  Z06: 4,
  Z07: 4,
  Z08: 5,
  Z09: 5,
  Z10: 4,
  Z11: 5,
};

// pseudo-random but deterministic
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260426);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// VIN counter
let vinCounter = 50000;
function nextVin() {
  vinCounter += 1;
  return `RLHPC00${vinCounter}`;
}

const vehicles: Vehicle[] = [];
const zones: Zone[] = [];

// Build zones, lanes, and vehicles
for (const plan of ZONE_MODEL_PLAN) {
  const zoneId = plan.id;
  const laneCount = LANES_PER_ZONE[zoneId];
  const baseLaneCap = Math.floor(plan.capacity / laneCount);
  const remainder = plan.capacity - baseLaneCap * laneCount;

  // Target fill ratio per zone (so we get a mix of fill levels like the screenshot)
  const fillRatios: Record<string, number> = {
    Z01: 0.76,
    Z02: 0.83,
    Z03: 0.69,
    Z04: 0.7,
    Z05: 0.73,
    Z06: 0.71,
    Z07: 0.73,
    Z08: 0.71,
    Z09: 0.56,
    Z10: 0.56,
    Z11: 0.63,
  };
  const targetFill = fillRatios[zoneId] ?? 0.7;

  const lanes: Lane[] = [];
  for (let i = 0; i < laneCount; i++) {
    const laneCap = baseLaneCap + (i < remainder ? 1 : 0);
    // Pick the model assignment for this lane.
    // If zone has 2 models, alternate. Otherwise use the only one.
    const modelDef = plan.models[i % plan.models.length];
    const primaryColor = COLORS[(i * 3 + zoneId.charCodeAt(2)) % COLORS.length];

    const targetLaneFill = Math.round(laneCap * targetFill);
    const laneVins: string[] = [];

    for (let v = 0; v < targetLaneFill; v++) {
      // 90% of vehicles match the lane's primary model+color.
      // 10% drift due to consolidation (1-2 different items per lane).
      const drift = rand() < 0.12 && v >= laneCap - 2;
      const useColor = drift ? pick(COLORS) : primaryColor;
      // For drift, optionally swap to another model from the same zone
      const useModel =
        drift && plan.models.length > 1
          ? plan.models[(i + 1) % plan.models.length]
          : modelDef;

      const arrivedDate = new Date(2026, 2 + Math.floor(rand() * 2), 1 + Math.floor(rand() * 28), 8 + Math.floor(rand() * 10));
      const placedDate = new Date(arrivedDate.getTime() + (1 + Math.floor(rand() * 4)) * 24 * 3600 * 1000);

      const history: HistoryEntry[] = [
        {
          ts: fmtTime(arrivedDate),
          from: "—",
          to: "RECV",
          note: "Xe nhập kho từ nhà máy",
        },
        {
          ts: fmtTime(placedDate),
          from: "RECV",
          to: `${zoneId}/L${i + 1}`,
          note: "Sắp xếp vào zone",
        },
      ];

      // Diversify history: ~15% have a consolidation move from another zone
      if (rand() < 0.15) {
        const otherZone = `Z${String(((parseInt(zoneId.slice(1)) + 3) % 11) + 1).padStart(2, "0")}`;
        const consolidatedDate = new Date(placedDate.getTime() + (2 + Math.floor(rand() * 6)) * 24 * 3600 * 1000);
        // overwrite the second entry to be RECV -> otherZone, then a move
        history[1] = {
          ts: fmtTime(placedDate),
          from: "RECV",
          to: `${otherZone}/L${1 + Math.floor(rand() * 4)}`,
          note: "Sắp xếp vào zone",
        };
        history.push({
          ts: fmtTime(consolidatedDate),
          from: history[1].to,
          to: `${zoneId}/L${i + 1}`,
          note: "Dồn kho — chuyển zone để gom cùng MTOC",
        });
      }

      // ~5% had been to NG and back
      if (rand() < 0.05) {
        const ngDate = new Date(placedDate.getTime() + 24 * 3600 * 1000);
        const fixDate = new Date(ngDate.getTime() + 2 * 24 * 3600 * 1000);
        const backDate = new Date(fixDate.getTime() + 12 * 3600 * 1000);
        history.push(
          { ts: fmtTime(ngDate), from: history[history.length - 1].to, to: "NG", note: "Phát hiện lỗi ngoại quan" },
          { ts: fmtTime(fixDate), from: "NG", to: "MAINT", note: "Chuyển nhà máy sửa lỗi" },
          { ts: fmtTime(backDate), from: "MAINT", to: `${zoneId}/L${i + 1}`, note: "Sửa OK — quay lại layout" },
        );
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
      capacity: laneCap,
      primaryModelCode: modelDef.code,
      primaryColorCode: primaryColor.code,
      vehicleVins: laneVins,
    });
  }

  zones.push({
    id: zoneId,
    label: `Zone ${zoneId.slice(1)}`,
    capacity: plan.capacity,
    lanes,
    modelNames: plan.models.map((m) => m.name),
  });
}

// ---------- Special areas: NG, MAINT, RECV ----------
function makeSpecialVehicle(status: Vehicle["status"]): Vehicle {
  const model = pick([
    { code: "NSC110", name: "Vision", type: "K2CN", option: "V00" },
    { code: "ACA125", name: "Air Blade 125", type: "K3AG", option: "V00" },
    { code: "SH125", name: "SH 125", type: "K3SH", option: "V02" },
    { code: "WAV125", name: "Wave RSX", type: "K1RS", option: "V04" },
  ]);
  const c = pick(COLORS);
  const arrived = new Date(2026, 2 + Math.floor(rand() * 2), 1 + Math.floor(rand() * 28), 8 + Math.floor(rand() * 10));
  const history: HistoryEntry[] = [
    { ts: fmtTime(arrived), from: "—", to: "RECV", note: "Xe nhập kho từ nhà máy" },
  ];
  if (status === "in_ng") {
    const t = new Date(arrived.getTime() + 24 * 3600 * 1000);
    history.push({ ts: fmtTime(t), from: "RECV", to: "NG", note: "Phát hiện lỗi ngoại quan khi kiểm tra" });
  } else if (status === "in_maintenance") {
    const t1 = new Date(arrived.getTime() + 24 * 3600 * 1000);
    const t2 = new Date(t1.getTime() + 24 * 3600 * 1000);
    history.push(
      { ts: fmtTime(t1), from: "RECV", to: "NG", note: "Phát hiện lỗi ngoại quan" },
      { ts: fmtTime(t2), from: "NG", to: "MAINT", note: "Chuyển nhà máy bảo dưỡng để sửa lỗi" },
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

const ngCount = 25;
const maintCount = 12;
const recvCount = 40;
for (let i = 0; i < ngCount; i++) vehicles.push(makeSpecialVehicle("in_ng"));
for (let i = 0; i < maintCount; i++) vehicles.push(makeSpecialVehicle("in_maintenance"));
for (let i = 0; i < recvCount; i++) vehicles.push(makeSpecialVehicle("in_receiving"));

const specialAreas: SpecialArea[] = [
  {
    id: "NG",
    label: "NG Zone (lỗi ngoại quan)",
    shortDesc: "Xe đang chờ kiểm tra / chuyển sửa",
    longDesc:
      "Khu vực giữ tạm xe có lỗi ngoại quan (xước, trầy, móp, xây). Sau khi kiểm tra sẽ chuyển sang Nhà máy bảo dưỡng để sửa, rồi quay lại layout.",
    count: ngCount,
    capacity: 30,
  },
  {
    id: "MAINT",
    label: "Nhà máy bảo dưỡng",
    shortDesc: "Đang sửa lỗi ngoại quan",
    longDesc:
      "Xe đang được sửa các lỗi bề mặt. Sau khi OK sẽ được chuyển trở lại layout đúng zone theo MTOC.",
    count: maintCount,
    capacity: 20,
  },
  {
    id: "RECV",
    label: "Receiving Area",
    shortDesc: "Mới nhập kho, chờ kiểm tra",
    longDesc:
      "Khu vực nhận xe từ nhà máy. Sau khi kiểm tra ngoại quan, xe OK sẽ vào layout, xe lỗi sẽ chuyển sang NG Zone.",
    count: recvCount,
    capacity: 50,
  },
];

// ---------- DDP plans ----------
function buildDDP(
  id: string,
  carrier: string,
  status: DDP["status"],
  date: string,
  items: Array<{
    modelName: string;
    modelCode: string;
    typeCode: string;
    optionCode: string;
    colorCode: string;
    colorName: string;
    colorHex: string;
    qty: number;
    suggestedZoneId: string;
  }>,
): DDP {
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  return {
    id,
    carrier,
    createdAt: date,
    status,
    totalQty,
    items: items.map((it, idx) => ({
      ...it,
      id: `${id}-line-${idx}`,
      selectedVins: [],
    })),
  };
}

const ddps: DDP[] = [
  buildDDP("DDP-NKV-001", "Nhật Kim Vinh (NKV)", "processing", "26/4/2026", [
    { modelName: "Vision", modelCode: "NSC110", typeCode: "K2CN", optionCode: "V00", colorCode: "NHA76", colorName: "Đen", colorHex: "#0a0a0a", qty: 8, suggestedZoneId: "Z01" },
    { modelName: "Vision", modelCode: "NSC110", typeCode: "K2CN", optionCode: "V00", colorCode: "V05", colorName: "Trắng", colorHex: "#f5f5f5", qty: 7, suggestedZoneId: "Z01" },
    { modelName: "Wave Alpha", modelCode: "WAV110", typeCode: "K1CN", optionCode: "V01", colorCode: "R322", colorName: "Đỏ", colorHex: "#dc2626", qty: 8, suggestedZoneId: "Z02" },
    { modelName: "SH 125", modelCode: "SH125", typeCode: "K3SH", optionCode: "V02", colorCode: "NHB18", colorName: "Đen nhám", colorHex: "#1f1f1f", qty: 7, suggestedZoneId: "Z03" },
  ]),
  buildDDP("DDP-PA-002", "Phương Anh Logistics", "waiting", "26/4/2026", [
    { modelName: "Air Blade 125", modelCode: "ACA125", typeCode: "K3AG", optionCode: "V00", colorCode: "NHB18", colorName: "Đen nhám", colorHex: "#1f1f1f", qty: 12, suggestedZoneId: "Z04" },
    { modelName: "Air Blade 125", modelCode: "ACA125", typeCode: "K3AG", optionCode: "V00", colorCode: "YR381", colorName: "Vàng", colorHex: "#facc15", qty: 8, suggestedZoneId: "Z04" },
    { modelName: "Future Sport", modelCode: "FSH125", typeCode: "K1NG", optionCode: "V02", colorCode: "NHA76", colorName: "Đen", colorHex: "#0a0a0a", qty: 10, suggestedZoneId: "Z10" },
    { modelName: "Lead 125", modelCode: "NHX125", typeCode: "K2TJ", optionCode: "V05", colorCode: "V05", colorName: "Trắng", colorHex: "#f5f5f5", qty: 10, suggestedZoneId: "Z05" },
  ]),
  buildDDP("DDP-VTC-003", "Vetranco South", "waiting", "26/4/2026", [
    { modelName: "SH 160", modelCode: "SH160", typeCode: "K3SI", optionCode: "V08", colorCode: "G401", colorName: "Xanh lá", colorHex: "#16a34a", qty: 12, suggestedZoneId: "Z07" },
    { modelName: "Winner X", modelCode: "WIN150", typeCode: "K1WX", optionCode: "V07", colorCode: "B603", colorName: "Xanh dương", colorHex: "#2563eb", qty: 13, suggestedZoneId: "Z08" },
    { modelName: "Future 125", modelCode: "FUT125", typeCode: "K2FU", optionCode: "V03", colorCode: "B521", colorName: "Xanh ngọc", colorHex: "#06b6d4", qty: 13, suggestedZoneId: "Z11" },
    { modelName: "Wave RSX", modelCode: "WAV125", typeCode: "K1RS", optionCode: "V04", colorCode: "R322", colorName: "Đỏ", colorHex: "#dc2626", qty: 12, suggestedZoneId: "Z09" },
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
