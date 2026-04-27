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
  { code: "NHC60", name: "Xám titan", hex: "#5a5a5a" },
  { code: "NHB25", name: "Xám đen", hex: "#3a3a3a" },
  { code: "NHC26", name: "Xám bạc", hex: "#9ca3af" },
  { code: "NHD14", name: "Trắng ngọc trai", hex: "#f5f5f5" },
  { code: "NHD01", name: "Trắng", hex: "#fafafa" },
  { code: "NHD03", name: "Trắng kem", hex: "#fef9c3" },
  { code: "YR381", name: "Vàng", hex: "#facc15" },
  { code: "R368", name: "Đỏ Honda", hex: "#dc2626" },
  { code: "R389", name: "Đỏ rượu", hex: "#7f1d1d" },
  { code: "PB421", name: "Xanh dương ngọc", hex: "#2563eb" },
  { code: "PB434", name: "Xanh dương đậm", hex: "#1e3a8a" },
  { code: "NHC35", name: "Xanh rêu", hex: "#4d7c0f" },
  { code: "NHC34", name: "Bạc", hex: "#cbd5e1" },
];

// ---------- Models thật từ CSV ----------
const MODELS: Record<
  string,
  { code: string; name: string; type: string; option: string }
> = {
  NSC110: { code: "NSC110", name: "Vision", type: "K2CN", option: "V03" },
  ACA125: { code: "ACA125", name: "Air Blade 125", type: "K3AG", option: "V00" },
  AFS125: { code: "AFS125", name: "Air Blade 125 Sport", type: "K73Y", option: "V02" },
  FSH125: { code: "FSH125", name: "Future 125", type: "K1NG", option: "V03" },
  AFB110: { code: "AFB110", name: "Wave Alpha", type: "K89R", option: "V41" },
  SH125: { code: "SH125", name: "SH 125", type: "K0RP", option: "V01" },
  NHX125: { code: "NHX125", name: "Lead 125", type: "K2TJ", option: "V05" },
  SH160: { code: "SH160", name: "SH 160", type: "K0SP", option: "V08" },
  ACA160: { code: "ACA160", name: "Air Blade 160", type: "K2ZG", option: "V06" },
  AFP110: { code: "AFP110", name: "Wave RSX", type: "K90P", option: "V01" },
  FS150: { code: "FS150", name: "Winner X", type: "K2PN", option: "V13" },
  ACB125: { code: "ACB125", name: "Air Blade 125 ABS", type: "K2VG", option: "V25" },
};

// ---------- Layout LOG2 (ảnh user gửi) ----------
// 13 zones tương ứng A1..A13. Mỗi zone có model & sức chứa hợp lý.
const ZONE_PLAN: Array<{
  id: string;
  capacity: number;
  models: string[]; // keys of MODELS
  fillRatio: number;
  status: "normal" | "full" | "maintenance";
  maintenanceReason?: string;
  maintenanceStart?: string;
  maintenanceEnd?: string;
}> = [
  { id: "A1", capacity: 60, models: ["NSC110"], fillRatio: 0.78, status: "normal" },
  { id: "A2", capacity: 90, models: ["NSC110", "AFB110"], fillRatio: 0.72, status: "normal" },
  { id: "A3", capacity: 30, models: ["AFP110"], fillRatio: 0.5, status: "normal" }, // Spare parts area thực ra vẫn là spare
  { id: "A4", capacity: 55, models: ["FSH125"], fillRatio: 0.85, status: "normal" },
  { id: "A5", capacity: 95, models: ["ACA125", "AFS125"], fillRatio: 1.0, status: "full" }, // FULL
  { id: "A6", capacity: 30, models: ["NHX125"], fillRatio: 0.6, status: "normal" },
  { id: "A7", capacity: 90, models: ["SH125", "SH160"], fillRatio: 0.66, status: "normal" },
  { id: "A8", capacity: 80, models: ["ACA160", "ACB125"], fillRatio: 0.0, status: "maintenance",
    maintenanceReason: "Sửa nền & sơn lại vạch chia làn",
    maintenanceStart: "24/4/2026",
    maintenanceEnd: "29/4/2026",
  },
  { id: "A9", capacity: 30, models: ["NHX125"], fillRatio: 0.7, status: "normal" },
  { id: "A10", capacity: 90, models: ["FS150", "AFS125"], fillRatio: 0.55, status: "normal" },
  { id: "A11", capacity: 65, models: ["AFB110"], fillRatio: 0.74, status: "normal" },
  { id: "A12", capacity: 80, models: ["NSC110"], fillRatio: 0.69, status: "normal" },
  { id: "A13", capacity: 90, models: ["SH125", "ACA125"], fillRatio: 0.62, status: "normal" },
];

const LANES_PER_ZONE: Record<string, number> = {
  A1: 4, A2: 5, A3: 3, A4: 4, A5: 5, A6: 3, A7: 5, A8: 4,
  A9: 3, A10: 5, A11: 4, A12: 5, A13: 5,
};

// ---------- pseudo-random deterministic ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260427);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

function fmtTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function fmtDate(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

let vinCounter = 50000;
function nextVin() {
  vinCounter += 1;
  return `RLHPC00${vinCounter}`;
}

const vehicles: Vehicle[] = [];
const zones: Zone[] = [];

// Build zones, lanes, vehicles
for (const plan of ZONE_PLAN) {
  const zoneId = plan.id;
  const laneCount = LANES_PER_ZONE[zoneId];
  const baseLaneCap = Math.floor(plan.capacity / laneCount);
  const remainder = plan.capacity - baseLaneCap * laneCount;

  const lanes: Lane[] = [];
  // Maintenance zones don't host vehicles
  const effectiveFill = plan.status === "maintenance" ? 0 : plan.fillRatio;

  for (let i = 0; i < laneCount; i++) {
    const laneCap = baseLaneCap + (i < remainder ? 1 : 0);
    const modelKey = plan.models[i % plan.models.length];
    const modelDef = MODELS[modelKey];
    const primaryColor = COLORS[(i * 3 + zoneId.charCodeAt(zoneId.length - 1)) % COLORS.length];

    const targetLaneFill = Math.round(laneCap * effectiveFill);
    const laneVins: string[] = [];

    for (let v = 0; v < targetLaneFill; v++) {
      const drift = rand() < 0.12 && v >= laneCap - 2;
      const useColor = drift ? pick(COLORS) : primaryColor;
      const useModel =
        drift && plan.models.length > 1
          ? MODELS[plan.models[(i + 1) % plan.models.length]]
          : modelDef;

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
        { ts: fmtTime(placedDate), from: "RECV", to: `${zoneId}/L${i + 1}`, note: "Sắp xếp vào zone theo MTOC" },
      ];

      // ~15% consolidation từ zone khác
      if (rand() < 0.15) {
        const idx = (parseInt(zoneId.slice(1)) % 13) + 1;
        const otherZone = `A${idx}`;
        const consolidatedDate = new Date(placedDate.getTime() + (2 + Math.floor(rand() * 6)) * 24 * 3600 * 1000);
        history[1] = { ts: fmtTime(placedDate), from: "RECV", to: `${otherZone}/L${1 + Math.floor(rand() * 4)}`, note: "Sắp xếp vào zone ban đầu" };
        history.push({ ts: fmtTime(consolidatedDate), from: history[1].to, to: `${zoneId}/L${i + 1}`, note: "Dồn kho — gom cùng MTOC để xuất hàng" });
      }

      // ~8% từng đi qua NG → sửa OK quay lại
      if (rand() < 0.08) {
        const ngDate = new Date(placedDate.getTime() + 24 * 3600 * 1000);
        const fixDate = new Date(ngDate.getTime() + 2 * 24 * 3600 * 1000);
        const okDate = new Date(fixDate.getTime() + 18 * 3600 * 1000);
        const backDate = new Date(okDate.getTime() + 4 * 3600 * 1000);
        const last = history[history.length - 1].to;
        history.push(
          { ts: fmtTime(ngDate), from: last, to: "NG", note: "Phát hiện lỗi ngoại quan (xước/móp)" },
          { ts: fmtTime(fixDate), from: "NG", to: "MAINT", note: "Chuyển nhà máy sửa chữa" },
          { ts: fmtTime(okDate), from: "MAINT", to: "QC", note: "Sửa OK — qua QC kiểm tra cuối" },
          { ts: fmtTime(backDate), from: "QC", to: `${zoneId}/L${i + 1}`, note: "Đạt QC — trả lại layout đúng MTOC" },
        );
      }

      // ~5% chuyển từ A8 (đang bảo trì) sang đây (mô phỏng dồn xe khi zone đóng)
      if (rand() < 0.05 && zoneId !== "A8") {
        const moveDate = new Date(placedDate.getTime() + 36 * 3600 * 1000);
        history.push({ ts: fmtTime(moveDate), from: history[history.length - 1].to, to: `${zoneId}/L${i + 1}`, note: "Chuyển từ A8 do A8 đang bảo trì nền/sơn" });
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
    label: zoneId,
    capacity: plan.capacity,
    lanes,
    modelNames: plan.models.map((k) => MODELS[k].name),
    status: plan.status,
    maintenanceReason: plan.maintenanceReason,
    maintenanceStart: plan.maintenanceStart,
    maintenanceEnd: plan.maintenanceEnd,
  });
}

// ---------- Special areas ----------
function makeSpecialVehicle(status: Vehicle["status"]): Vehicle {
  const modelKey = pick(Object.keys(MODELS));
  const model = MODELS[modelKey];
  const c = pick(COLORS);
  const arrived = new Date(2026, 2 + Math.floor(rand() * 2), 1 + Math.floor(rand() * 28), 8 + Math.floor(rand() * 10));
  const history: HistoryEntry[] = [
    { ts: fmtTime(arrived), from: "—", to: "RECV", note: "Xe nhập kho từ nhà máy Honda VN" },
  ];
  if (status === "in_ng") {
    const t = new Date(arrived.getTime() + 24 * 3600 * 1000);
    history.push({ ts: fmtTime(t), from: "RECV", to: "NG", note: "Phát hiện lỗi ngoại quan khi kiểm tra đầu vào" });
  } else if (status === "in_maintenance") {
    const t1 = new Date(arrived.getTime() + 24 * 3600 * 1000);
    const t2 = new Date(t1.getTime() + 24 * 3600 * 1000);
    history.push(
      { ts: fmtTime(t1), from: "RECV", to: "NG", note: "Phát hiện lỗi ngoại quan" },
      { ts: fmtTime(t2), from: "NG", to: "MAINT", note: "Chuyển nhà máy sửa lỗi" },
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
      "Khu giữ tạm xe có lỗi bề mặt (xước, trầy, móp). Sau khi xác nhận sẽ chuyển sang Nhà máy bảo dưỡng để sửa, sửa xong qua QC rồi quay lại layout.",
    count: ngCount,
    capacity: 30,
  },
  {
    id: "MAINT",
    label: "Nhà máy bảo dưỡng",
    shortDesc: "Đang sửa lỗi ngoại quan",
    longDesc:
      "Xe đang được sửa các lỗi bề mặt. Sau khi đạt QC sẽ được chuyển trở lại layout đúng zone theo MTOC.",
    count: maintCount,
    capacity: 20,
  },
  {
    id: "RECV",
    label: "Receiving Area",
    shortDesc: "Mới nhập kho, chờ kiểm tra",
    longDesc:
      "Khu nhận xe từ nhà máy. Sau khi kiểm tra ngoại quan, xe OK vào layout, xe lỗi chuyển sang NG Zone.",
    count: recvCount,
    capacity: 50,
  },
];

// ---------- DDP plans ----------
// Pick xe thật trong layout cho mỗi MTOC để đảm bảo MỌI line đều có gợi ý
function findAvailable(modelCode: string, colorCode: string): string | undefined {
  const z = zones.find((zz) =>
    zz.lanes.some((l) => l.primaryModelCode === modelCode),
  );
  if (z) return z.id;
  // fallback: find any vehicle
  const v = vehicles.find((vv) => vv.modelCode === modelCode && vv.colorCode === colorCode);
  return v?.zoneId;
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
  const items = itemSpecs.map((spec, idx) => {
    const m = MODELS[spec.modelKey];
    const color = COLORS.find((c) => c.code === spec.colorCode)!;
    const suggestedZoneId =
      findAvailable(m.code, color.code) ??
      zones.find((z) => z.lanes.some((l) => l.primaryModelCode === m.code))?.id ??
      zones[0].id;
    return {
      id: `${id}-line-${idx}`,
      modelName: m.name,
      modelCode: m.code,
      typeCode: m.type,
      optionCode: m.option,
      colorCode: color.code,
      colorName: color.name,
      colorHex: color.hex,
      qty: spec.qty,
      suggestedZoneId,
      selectedVins: [],
    };
  });
  const totalQty = items.reduce((s, it) => s + it.qty, 0);
  return { id, carrier, carrierCode, createdAt: date, status, totalQty, items };
}

// Carrier thật từ CSV: NKV, VETRANCO_S, VIJACO_S, PHUONGANH, VIJACO_N, DRAGON_S
const ddps: DDP[] = [
  buildDDP("DDP-NKV-001", "Nhật Kim Vinh", "NKV", "processing", "27/4/2026", [
    { modelKey: "NSC110", colorCode: "NHA76", qty: 8 },
    { modelKey: "NSC110", colorCode: "NHD14", qty: 7 },
    { modelKey: "AFB110", colorCode: "R368", qty: 8 },
    { modelKey: "SH125", colorCode: "NHB18", qty: 7 },
  ]),
  buildDDP("DDP-PA-002", "Phương Anh Logistics", "PHUONGANH", "waiting", "27/4/2026", [
    { modelKey: "ACA125", colorCode: "NHB18", qty: 12 },
    { modelKey: "AFS125", colorCode: "YR381", qty: 8 },
    { modelKey: "FSH125", colorCode: "NHA76", qty: 10 },
    { modelKey: "NHX125", colorCode: "NHD01", qty: 10 },
  ]),
  buildDDP("DDP-VTC-003", "Vetranco South", "VETRANCO_S", "waiting", "27/4/2026", [
    { modelKey: "SH160", colorCode: "NHC60", qty: 12 },
    { modelKey: "FS150", colorCode: "PB421", qty: 13 },
    { modelKey: "ACA160", colorCode: "R389", qty: 10 },
    { modelKey: "AFP110", colorCode: "R368", qty: 10 },
  ]),
  buildDDP("DDP-VJC-004", "Vijaco South", "VIJACO_S", "waiting", "27/4/2026", [
    { modelKey: "NSC110", colorCode: "YR381", qty: 10 },
    { modelKey: "SH125", colorCode: "NHC60", qty: 8 },
    { modelKey: "ACA125", colorCode: "NHA76", qty: 10 },
  ]),
  buildDDP("DDP-DRG-005", "Dragon South", "DRAGON_S", "waiting", "27/4/2026", [
    { modelKey: "FSH125", colorCode: "PB421", qty: 8 },
    { modelKey: "AFB110", colorCode: "NHC26", qty: 10 },
    { modelKey: "ACB125", colorCode: "NHB25", qty: 6 },
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

export { fmtDate };
