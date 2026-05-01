import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, History, MapPin, Package, Search, Upload, X } from "lucide-react";
import type { DDP, Vehicle } from "@/lib/warehouse/types";
import { lookupColor, findZoneForVehicleType } from "@/lib/warehouse/mockData";

interface SidebarProps {
  ddps: DDP[];
  vehicles: Vehicle[];
  onOpenDDP: (id: string) => void;
  activeDDPId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectVin: (vin: string) => void;
  onUploadDDP: (ddp: DDP) => void;
  onNavigateToZoneLane?: (zoneId: string, laneId: string) => void;
}

const STATUS_LABEL: Record<DDP["status"], string> = {
  waiting: "Chờ",
  processing: "Đang xử lý",
  done: "Hoàn thành",
};

const STATUS_TONE: Record<DDP["status"], string> = {
  waiting: "bg-muted text-muted-foreground",
  processing: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
};

export function Sidebar({
  ddps,
  vehicles,
  onOpenDDP,
  activeDDPId,
  searchQuery,
  setSearchQuery,
  onSelectVin,
  onUploadDDP,
  onNavigateToZoneLane,
}: SidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [assignVin, setAssignVin] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as Vehicle[];
    return vehicles
      .filter(
        (v) =>
          v.vin.toLowerCase().includes(q) ||
          v.modelCode.toLowerCase().includes(q) ||
          v.modelName.toLowerCase().includes(q) ||
          v.colorCode.toLowerCase().includes(q) ||
          v.colorName.toLowerCase().includes(q) ||
          v.typeCode.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [searchQuery, vehicles]);

  // Find matching orders for a vehicle (to suggest assignment)
  const matchingOrders = useMemo(() => {
    if (!assignVin) return [];
    const v = vehicles.find((vv) => vv.vin === assignVin);
    if (!v) return [];
    return ddps
      .filter((d) => d.status !== "done")
      .flatMap((d) =>
        d.items
          .filter(
            (it) =>
              it.modelCode === v.modelCode &&
              it.colorCode === v.colorCode &&
              it.selectedVins.length < it.qty &&
              !it.selectedVins.includes(v.vin),
          )
          .map((it) => ({ ddp: d, item: it })),
      );
  }, [assignVin, vehicles, ddps]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        const ddp = parseDDPFile(file.name, text, vehicles);
        onUploadDDP(ddp);
        setUploadMsg(`✓ Đã nhập ${ddp.id} (${ddp.totalQty} xe, ${ddp.items.length} MTOC)`);
        setTimeout(() => setUploadMsg(null), 4000);
      } catch (e) {
        setUploadMsg(`✗ Lỗi đọc file: ${(e as Error).message}`);
        setTimeout(() => setUploadMsg(null), 5000);
      }
    };
    reader.readAsText(file);
  }

  const assignVehicle = vehicles.find((v) => v.vin === assignVin);

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Tìm xe (VIN / MTOC / màu)</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="VIN, model, màu, type..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-8 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="mt-3 max-h-72 overflow-auto rounded-md border bg-background">
            {searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Không tìm thấy xe khớp "{searchQuery}"
              </div>
            ) : (
              <ul className="divide-y">
                {searchResults.map((v) => (
                  <li key={v.vin}>
                    <div className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted">
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          if (v.zoneId && v.laneId && onNavigateToZoneLane) {
                            onNavigateToZoneLane(v.zoneId, v.laneId);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full border"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          {v.modelName}
                          <span className="text-muted-foreground">· {v.colorName}</span>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {v.vin}
                        </div>
                        {v.zoneId && v.laneId && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                            <MapPin className="h-2.5 w-2.5 text-violet-600" />
                            <span className="font-medium text-violet-700">
                              {v.zoneId} · Làn L{v.laneId.split("-L")[1]}
                            </span>
                          </div>
                        )}
                        {!v.zoneId && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {statusLabel(v.status)}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectVin(v.vin)}
                          className="rounded border px-1.5 py-0.5 text-[10px] hover:bg-muted"
                          title="Xem lịch sử"
                        >
                          <History className="h-3 w-3" />
                        </button>
                        {v.status === "in_zone" && (
                          <button
                            type="button"
                            onClick={() => setAssignVin(assignVin === v.vin ? null : v.vin)}
                            className={`rounded border px-1.5 py-0.5 text-[10px] hover:bg-muted ${assignVin === v.vin ? "bg-primary/10 border-primary" : ""}`}
                            title="Ghép vào đơn hàng"
                          >
                            <Package className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Assign to order panel */}
                    {assignVin === v.vin && assignVehicle && (
                      <div className="border-t bg-violet-50 px-3 py-2">
                        <div className="mb-1 text-[10px] font-semibold text-violet-800">
                          Ghép xe này vào đơn hàng:
                        </div>
                        {matchingOrders.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground">
                            Không có đơn hàng nào cần {assignVehicle.modelName} · {assignVehicle.colorName}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {matchingOrders.map(({ ddp: d, item: it }) => (
                              <button
                                key={`${d.id}-${it.id}`}
                                type="button"
                                onClick={() => {
                                  onOpenDDP(d.id);
                                  setAssignVin(null);
                                }}
                                className="flex w-full items-center justify-between rounded border bg-white px-2 py-1.5 text-[10px] hover:bg-violet-100"
                              >
                                <div>
                                  <span className="font-semibold text-foreground">{d.id}</span>
                                  <span className="ml-1 text-muted-foreground">· {d.carrier}</span>
                                </div>
                                <span className="text-violet-700">
                                  Cần {it.qty - it.selectedVins.length} xe nữa
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
              {searchResults.length} kết quả {searchResults.length === 30 && "(hiển thị 30 đầu)"}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Upload đơn hàng</h3>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background py-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
          Click để upload file đơn hàng
        </button>
        {uploadMsg && (
          <div className="mt-2 rounded-md bg-muted p-2 text-[11px]">{uploadMsg}</div>
        )}
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          .csv / .tsv (UTF-8 hoặc UTF-16). Cột:{" "}
          <code className="rounded bg-muted px-1">MODEL_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">TYPE_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">COLOR_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">QTY</code>,{" "}
          <code className="rounded bg-muted px-1">TRANS_CODE</code>
        </p>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Danh sách đơn hàng ({ddps.length})
        </h3>
        <div className="space-y-2">
          {ddps.map((d) => {
            const totalSel = d.items.reduce((s, it) => s + it.selectedVins.length, 0);
            const pct = Math.round((totalSel / d.totalQty) * 100);
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => onOpenDDP(d.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all hover:border-primary hover:shadow-sm ${
                  activeDDPId === d.id ? "border-primary bg-primary/5" : "bg-background"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{d.id}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{d.carrier}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {d.totalQty} xe · {d.items.length} MTOC
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {totalSel}/{d.totalQty} đã chọn
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function statusLabel(s: Vehicle["status"]) {
  switch (s) {
    case "in_ng": return "NG";
    case "in_maintenance": return "Bảo dưỡng";
    case "in_receiving": return "Receiving";
    case "picked": return "Đã xuất";
    default: return "Layout";
  }
}

// Parse a CSV/TSV DDP file into a DDP object.
function parseDDPFile(fileName: string, text: string, vehicles: Vehicle[]): DDP {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delim = firstLine.includes("\t") ? "\t" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("File rỗng");

  const header = lines[0].split(delim).map((h) => h.trim().replace(/^"|"$/g, "").toUpperCase());
  const idx = (name: string) => header.findIndex((h) => h.includes(name));
  const iModel = idx("MODEL_CODE");
  const iType = idx("TYPE_CODE");
  const iOption = idx("OPTION_CODE");
  const iColor = idx("COLOR_CODE");
  const iQty = idx("QTY");
  const iTrans = idx("TRANS_CODE");
  if (iModel < 0 || iColor < 0 || iQty < 0) {
    throw new Error("Thiếu cột MODEL_CODE / COLOR_CODE / QTY");
  }

  const carriers = new Set<string>();
  type Agg = { modelCode: string; typeCode: string; optionCode: string; colorCode: string; qty: number };
  const map = new Map<string, Agg>();

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
    const modelRaw = (cells[iModel] ?? "").trim();
    const colorCode = (cells[iColor] ?? "").trim();
    const qty = parseInt(cells[iQty] ?? "0", 10) || 0;
    if (!modelRaw || !colorCode || qty <= 0) continue;
    const [modelCode, typeFromModel] = modelRaw.split(/\s+/);
    const typeCode = (cells[iType] ?? typeFromModel ?? "").trim();
    const optionCode = iOption >= 0 ? (cells[iOption] ?? "").trim() : "";
    if (iTrans >= 0 && cells[iTrans]) carriers.add(cells[iTrans]);

    const key = `${modelCode}|${typeCode}|${optionCode}|${colorCode}`;
    const cur = map.get(key);
    if (cur) cur.qty += qty;
    else map.set(key, { modelCode, typeCode, optionCode, colorCode, qty });
  }

  if (map.size === 0) throw new Error("Không có dòng dữ liệu hợp lệ");

  const carrierCode = Array.from(carriers)[0] ?? "UPLOAD";
  const id = `DDP-${carrierCode}-${Date.now().toString().slice(-4)}`;

  const items = Array.from(map.values()).map((a, idx2) => {
    const color = lookupColor(a.colorCode);
    const suggestedZoneId =
      findZoneForVehicleType(vehicles, a.modelCode, a.colorCode) ?? "—";
    return {
      id: `${id}-line-${idx2}`,
      modelName: a.modelCode,
      modelCode: a.modelCode,
      typeCode: a.typeCode,
      optionCode: a.optionCode,
      colorCode: a.colorCode,
      colorName: color?.name ?? a.colorCode,
      colorHex: color?.hex ?? "#9ca3af",
      qty: a.qty,
      suggestedZoneId,
      selectedVins: [] as string[],
    };
  });

  const totalQty = items.reduce((s, it) => s + it.qty, 0);

  return {
    id,
    carrier: carrierCode,
    carrierCode,
    createdAt: new Date().toLocaleDateString("vi-VN"),
    status: "waiting",
    totalQty,
    items,
  };
}
