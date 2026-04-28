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
const MODELS: Record<
  string,
  {
    code: string;
    name: string;
    type: string;
    option: string; // "" = trống/full
    colors: string[]; // các COLOR_CODE thực tế
  }
> = {
  NSC110: {
    code: "NSC110",
    name: "Vision",
    type: "K2CN",
    option: "V02",
    colors: ["YR381", "R368", "NHA76", "NHB18", "NHC60", "NHD01"],
  },
  ACA125: {
    code: "ACA125",
    name: "Air Blade 125",
    type: "K3AG",
    option: "",
    colors: ["NHB25", "R368", "NHA76", "NHC60", "NHD14", "PB434"],
  },
  AFS125: {
    code: "AFS125",
    name: "Air Blade 125 Sport",
    type: "K73Y",
    option: "V01",
    colors: ["NHC35", "NHC26", "PB421", "R350", "NHB55", "NHC34"],
  },
  FSH125: {
    code: "FSH125",
    name: "Future 125",
    type: "K1NG",
    option: "",
    colors: ["NHB18", "NHC60", "NHB35", "R368", "NHA76", "PB421"],
  },
  AFB110: {
    code: "AFB110",
    name: "Wave Alpha",
    type: "K89R",
    option: "V30",
    colors: ["NHA76", "PB421", "R389", "NHB55"],
  },
  SH125: {
    code: "SH125",
    name: "SH 125",
    type: "K0RP",
    option: "V05",
    colors: ["NHD03", "NHD01", "NHC60", "NHD14", "NHB25"],
  },
  NHX125: {
    code: "NHX125",
    name: "Lead 125",
    type: "K2TJ",
    option: "V02",
    colors: ["NHA76", "NHC34", "NHD14", "NHB18"],
  },
  SH160: {
    code: "SH160",
    name: "SH 160",
    type: "K0SP",
    option: "",
    colors: ["NHC60", "NHD03", "NHD14", "NHD01", "GY163", "R368"],
  },
  ACA160: {
    code: "ACA160",
    name: "Air Blade 160",
    type: "K2ZG",
    option: "V01",
    colors: ["NHD14", "R368", "NHA76"],
  },
  AFP110: {
    code: "AFP110",
    name: "Wave RSX",
    type: "K90P",
    option: "",
    colors: ["R368", "NHC60", "NHB25", "PB421"],
  },
  FS150: {
    code: "FS150",
    name: "Winner X",
    type: "K2PN",
    option: "V15",
    colors: ["NHA76", "NHB25", "NHC60", "GY163", "R389"],
  },
  ACB125: {
    code: "ACB125",
    name: "Air Blade 125 ABS",
    type: "K2VG",
    option: "V03",
    colors: ["NH436", "PB406"],
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
  { id: "A1", laneCount: 4, laneCapacity: 12, models: ["NSC110"], fillRatio: 0.78, status: "normal" }, // 48
  { id: "A2", laneCount: 5, laneCapacity: 20, models: ["NSC110", "AFB110"], fillRatio: 0.72, status: "normal" }, // 100
  { id: "A3", laneCount: 4, laneCapacity: 14, models: ["AFP110"], fillRatio: 0.55, status: "normal" }, // 56
  // Hàng giữa dưới — A4 nhỏ, A5 lớn nhất (full), A6 vuông
  { id: "A4", laneCount: 4, laneCapacity: 12, models: ["FSH125"], fillRatio: 0.85, status: "normal" }, // 48
  { id: "A5", laneCount: 5, laneCapacity: 20, models: ["ACA125", "AFS125"], fillRatio: 1.0, status: "full" }, // 100
  { id: "A6", laneCount: 4, laneCapacity: 14, models: ["NHX125"], fillRatio: 0.6, status: "normal" }, // 56
  // Hàng giữa trên — A7 dài, A8 bảo trì, A9 nhỏ
  { id: "A7", laneCount: 4, laneCapacity: 18, models: ["SH125", "SH160"], fillRatio: 0.66, status: "normal" }, // 72
  { id: "A8", laneCount: 5, laneCapacity: 16, models: ["ACA160", "ACB125"], fillRatio: 0, status: "maintenance",
    maintenanceReason: "Sửa nền & sơn lại vạch chia làn",
    maintenanceStart: "24/4/2026",
    maintenanceEnd: "29/4/2026",
  }, // 80
  { id: "A9", laneCount: 3, laneCapacity: 12, models: ["NHX125"], fillRatio: 0.7, status: "normal" }, // 36
  // Hàng trên — A10 ngang, A11 ngang, A12 ngang vuông nhiều làn ngắn, A13 dọc dài
  { id: "A10", laneCount: 4, laneCapacity: 16, models: ["FS150", "AFS125"], fillRatio: 0.55, status: "normal" }, // 64
  { id: "A11", laneCount: 4, laneCapacity: 14, models: ["AFB110"], fillRatio: 0.74, status: "normal" }, // 56
  { id: "A12", laneCount: 6, laneCapacity: 12, models: ["NSC110"], fillRatio: 0.69, status: "normal" }, // 72 — nhiều làn, làn ngắn
  { id: "A13", laneCount: 5, laneCapacity: 18, models: ["SH125", "ACA125"], fillRatio: 0.62, status: "normal" }, // 90 — ít làn, làn dài
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
  const laneCount = plan.laneCount;
  const capacity = laneCount * plan.laneCapacity;

  const lanes: Lane[] = [];
  const effectiveFill = plan.status === "maintenance" ? 0 : plan.fillRatio;

  // Phân chia màu cho các làn: mỗi làn 1 (model + màu) ổn định.
  // Khi zone có 2 model → xen kẽ. Khi có nhiều màu hơn số làn → rải đa dạng.
  for (let i = 0; i < laneCount; i++) {
    const modelKey = plan.models[i % plan.models.length];
    const modelDef = MODELS[modelKey];
    // Pick màu thực tế của model — luân phiên để đa dạng trên các làn
    const colorIdx =
      (Math.floor(i / plan.models.length) + zoneId.charCodeAt(zoneId.length - 1)) %
      modelDef.colors.length;
    const primaryColorCode = modelDef.colors[colorIdx];
    const primaryColor = COLORS.find((c) => c.code === primaryColorCode)!;

    const targetLaneFill = Math.round(plan.laneCapacity * effectiveFill);
    const laneVins: string[] = [];

    for (let v = 0; v < targetLaneFill; v++) {
      // ~10% xe lệch (dồn kho từ làn/zone khác): khác màu hoặc khác model phụ
      const drift = rand() < 0.1 && v >= plan.laneCapacity - 3;
      let useColor = primaryColor;
      let useModel = modelDef;
      if (drift) {
        if (plan.models.length > 1 && rand() < 0.5) {
          useModel = MODELS[plan.models[(i + 1) % plan.models.length]];
          useColor =
            COLORS.find((c) => c.code === useModel.colors[0]) ?? primaryColor;
        } else {
          // Đổi sang màu khác cùng model (vẫn trong list màu thực tế)
          const altColorCode =
            modelDef.colors[(colorIdx + 1) % modelDef.colors.length];
          useColor = COLORS.find((c) => c.code === altColorCode) ?? primaryColor;
        }
      }

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

      // ~15% consolidation: từng ở zone khác → dồn về đây
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
          note: "Dồn kho — gom cùng MTOC để xuất hàng",
        });
      }

      // ~12% từng đi qua NG → MAINT → QC → quay lại layout
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
          { ts: fmtTime(backDate), from: "QC", to: `${zoneId}/L${i + 1}`, note: "Đạt QC — trả lại layout đúng MTOC" },
        );
      }

      // ~5% từng dồn từ A8 (đang bảo trì) sang đây
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
      primaryModelCode: modelDef.code,
      primaryColorCode: primaryColor.code,
      vehicleVins: laneVins,
    });
  }

  zones.push({
    id: zoneId,
    label: zoneId,
    capacity,
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
  const v = vehicles.find(
    (vv) => vv.status === "in_zone" && vv.modelCode === modelCode && vv.colorCode === colorCode,
  );
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
      { modelKey: "NSC110", colorCode: "YR381", qty: 14 },
      { modelKey: "NSC110", colorCode: "NHA76", qty: 12 },
      { modelKey: "AFB110", colorCode: "PB421", qty: 12 },
      { modelKey: "SH125", colorCode: "NHD03", qty: 12 },
    ],
  ),
  // 40 xe
  buildDDP("DDP-PA-002", "Phương Anh Logistics", "PHUONGANH", "waiting", "27/4/2026", [
    { modelKey: "ACA125", colorCode: "NHB25", qty: 12 },
    { modelKey: "AFS125", colorCode: "NHC35", qty: 10 },
    { modelKey: "FSH125", colorCode: "NHB18", qty: 10 },
    { modelKey: "NHX125", colorCode: "NHA76", qty: 8 },
  ]),
  // 30 xe
  buildDDP("DDP-VTC-003", "Vetranco South", "VETRANCO_S", "waiting", "27/4/2026", [
    { modelKey: "SH160", colorCode: "NHC60", qty: 10 },
    { modelKey: "FS150", colorCode: "NHA76", qty: 8 },
    { modelKey: "ACA160", colorCode: "NHD14", qty: 6 },
    { modelKey: "AFP110", colorCode: "R368", qty: 6 },
  ]),
  // 40 xe
  buildDDP("DDP-VJC-004", "Vijaco South", "VIJACO_S", "waiting", "27/4/2026", [
    { modelKey: "NSC110", colorCode: "R368", qty: 16 },
    { modelKey: "SH125", colorCode: "NHD01", qty: 12 },
    { modelKey: "ACA125", colorCode: "R368", qty: 12 },
  ]),
  // 50 xe
  buildDDP("DDP-DRG-005", "Dragon South", "DRAGON_S", "waiting", "27/4/2026", [
    { modelKey: "FSH125", colorCode: "NHC60", qty: 16 },
    { modelKey: "AFB110", colorCode: "NHA76", qty: 18 },
    { modelKey: "AFS125", colorCode: "PB421", qty: 16 },
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
