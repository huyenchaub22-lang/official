export type FillLevel = "low" | "medium" | "high" | "full";

export type VehicleStatus = "in_zone" | "in_ng" | "in_maintenance" | "in_receiving" | "picked";

export type ZoneStatus = "normal" | "full" | "maintenance";

export interface HistoryEntry {
  ts: string;
  from: string;
  to: string;
  note: string;
}

export interface Vehicle {
  vin: string;
  modelName: string;
  modelCode: string;
  typeCode: string;
  optionCode: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  arrivedAt: string;
  status: VehicleStatus;
  zoneId?: string;
  laneId?: string;
  history: HistoryEntry[];
}

export interface Lane {
  id: string;
  label: string;
  capacity: number;
  primaryModelCode: string;
  primaryColorCode: string;
  vehicleVins: string[];
}

export interface Zone {
  id: string; // A1..A13
  label: string;
  capacity: number;
  lanes: Lane[];
  modelNames: string[];
  status: ZoneStatus;
  maintenanceStart?: string;
  maintenanceEnd?: string;
  maintenanceReason?: string;
}

export interface DDPLineItem {
  id: string;
  modelName: string;
  modelCode: string;
  typeCode: string;
  optionCode: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  qty: number;
  suggestedZoneId: string;
  selectedVins: string[];
}

export type DDPStatus = "waiting" | "processing" | "done";

export interface DDP {
  id: string;
  carrier: string;
  carrierCode: string;
  createdAt: string;
  status: DDPStatus;
  totalQty: number;
  items: DDPLineItem[];
  completedAt?: string;
}

export interface SpecialArea {
  id: "NG" | "MAINT" | "RECV";
  label: string;
  shortDesc: string;
  longDesc: string;
  count: number;
  capacity: number;
}

export interface PickContext {
  ddpId?: string;
  lineId?: string;
  modelCode?: string;
  typeCode?: string;
  optionCode?: string;
  colorCode?: string;
  modelName?: string;
  colorName?: string;
  vin?: string;
  qty?: number;
  isGlobalSearch?: boolean;
}

// KI (kiem ke) types.
// A MTOC is one exact model/type/option/color combination. One phieu can only
// represent one MTOC; quantity is the system count of all matching vehicles.

export type KIPeriod = "DAY" | "MONTH" | "YEAR";

export interface KILocationCount {
  location: string;
  qty: number;
}

export interface KIFrameRecord {
  vin: string;
  status: VehicleStatus;
  location: string;
  zoneId?: string;
  laneId?: string;
  arrivedAt: string;
  lastHistoryAt: string;
}

export interface KISnapshotItem {
  mtocKey: string; // `${modelCode}|${typeCode}|${optionCode}|${colorCode}`
  modelCode: string;
  modelName: string;
  typeCode: string;
  optionCode: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  primaryLocation: string;
  locationCounts: KILocationCount[];
  frameRecords: KIFrameRecord[];
  frameNumbers: string[];
  qty: number;
}

export interface KISnapshot {
  id: string;
  createdAt: string;
  period: KIPeriod;
  periodLabel: string;
  totalQty: number;
  items: KISnapshotItem[];
}

export type PhieuStatus = "CHUA_KIEM_TRA" | "DANG_KIEM_TRA" | "DA_CHOT";

export type KetQuaKiemTra = "KHOP" | "KHONG_KHOP";

export interface KiemTraThucDiaItem {
  vin: string;
  systemFound: boolean;
  belongsToPhieu: boolean;
  expectedLocation: string | null;
  currentLocation: string | null;
  zoneId?: string;
  laneId?: string;
  currentStatus: VehicleStatus | null;
  arrivedAt: string | null;
  lastHistoryAt: string | null;
  ketQua: KetQuaKiemTra | null;
  ghiChu: string;
  checkedAt: string | null;
}

export type LoaiChenhLech = "THIEU" | "THUA";

export interface PhuLucDieuChinh {
  loaiChenhLech: LoaiChenhLech;
  soLuong: number;
  lyDo: string;
  nguoiLap: string;
  ghiChu: string;
  createdAt: string;
  soLuongSauDieuChinh: number;
}

export interface PhieuKiemKe {
  phieuNo: string;
  snapshotId: string;
  mtocKey: string;
  modelCode: string;
  modelName: string;
  typeCode: string;
  optionCode: string;
  colorCode: string;
  colorName: string;
  colorHex: string;
  primaryLocation: string;
  locationCounts: KILocationCount[];
  frameRecords: KIFrameRecord[];
  frameNumbers: string[];
  maBlock: string;
  systemQty: number;
  nguoiDem: string;
  nguoiXacNhan: string;
  auditorName: string;
  soLuongThanhTra: number | null;
  inspectionList: KiemTraThucDiaItem[];
  adjustmentAppendix: PhuLucDieuChinh | null;
  note: string;
  status: PhieuStatus;
  createdAt: string;
  confirmedAt: string | null;
}
