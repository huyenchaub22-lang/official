export type FillLevel = "low" | "medium" | "high" | "full";

export type VehicleStatus =
  | "in_zone"
  | "in_ng"
  | "in_maintenance"
  | "in_receiving"
  | "picked";

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
  // Maintenance metadata (only when status === "maintenance")
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
