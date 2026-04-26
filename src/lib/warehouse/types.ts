export type FillLevel = "low" | "medium" | "high" | "full";

export type VehicleStatus =
  | "in_zone"
  | "in_ng"
  | "in_maintenance"
  | "in_receiving"
  | "picked";

export interface HistoryEntry {
  ts: string; // formatted timestamp
  from: string; // e.g. "—", "RECV", "Z01/L1", "NG", "MAINT"
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
  label: string; // L1..L5
  capacity: number;
  // Lanes group vehicles with the same characteristics.
  // Most vehicles match (modelCode + colorCode); 1-2 may differ due to consolidation.
  primaryModelCode: string;
  primaryColorCode: string;
  vehicleVins: string[];
}

export interface Zone {
  id: string; // Z01..Z11
  label: string;
  capacity: number;
  lanes: Lane[];
  // a short list of model names dominant in this zone (for distribution card)
  modelNames: string[];
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
  // VINs the user has selected for this line item
  selectedVins: string[];
}

export type DDPStatus = "waiting" | "processing" | "done";

export interface DDP {
  id: string;
  carrier: string;
  createdAt: string;
  status: DDPStatus;
  totalQty: number;
  items: DDPLineItem[];
}

export interface SpecialArea {
  id: "NG" | "MAINT" | "RECV";
  label: string;
  shortDesc: string;
  longDesc: string;
  count: number;
  capacity: number;
}
