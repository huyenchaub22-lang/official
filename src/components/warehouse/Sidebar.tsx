import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import type { DDP, Vehicle } from "@/lib/warehouse/types";
import { lookupColor, findZoneForVehicleType, COLORS } from "@/lib/warehouse/mockData";

interface SidebarProps {
  ddps: DDP[];
  vehicles: Vehicle[];
  onOpenDDP: (id: string) => void;
  activeDDPId: string | null;
  onUploadDDP: (ddp: DDP) => void;
  onStartGlobalSearch?: (ctx: { modelCode?: string; typeCode?: string; optionCode?: string; colorCode?: string; vin?: string; modelName?: string; colorName?: string; }) => void;
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
  onUploadDDP,
  onStartGlobalSearch,
}: SidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Search Form State
  const [searchModel, setSearchModel] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchOption, setSearchOption] = useState("");
  const [searchColor, setSearchColor] = useState("");
  const [searchVin, setSearchVin] = useState("");

  // Extract unique options for dropdowns based on vehicles
  const uniqueModels = useMemo(() => Array.from(new Set(vehicles.map((v) => v.modelCode))).filter(Boolean).sort(), [vehicles]);
  const uniqueTypes = useMemo(() => Array.from(new Set(vehicles.filter((v) => !searchModel || v.modelCode === searchModel).map((v) => v.typeCode))).sort(), [vehicles, searchModel]);
  const uniqueOptions = useMemo(() => Array.from(new Set(vehicles.filter((v) => (!searchModel || v.modelCode === searchModel) && (!searchType || v.typeCode === searchType)).map((v) => v.optionCode))).sort(), [vehicles, searchModel, searchType]);
  const uniqueColors = useMemo(() => Array.from(new Set(vehicles.filter((v) => (!searchModel || v.modelCode === searchModel) && (!searchType || v.typeCode === searchType)).map((v) => v.colorCode))).filter(Boolean).sort(), [vehicles, searchModel, searchType]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!onStartGlobalSearch) return;
    
    // Chỉ submit khi có ít nhất 1 trường được điền
    if (!searchModel && !searchType && !searchOption && !searchColor && !searchVin) {
      alert("Vui lòng nhập ít nhất 1 thông tin để tra cứu.");
      return;
    }

    onStartGlobalSearch({
      modelCode: searchModel.trim(),
      typeCode: searchType.trim(),
      optionCode: searchOption.trim(),
      colorCode: searchColor.trim(),
      vin: searchVin.trim(),
      modelName: searchModel.trim(), // For display
      colorName: searchColor.trim(), // For display
    });
  }

  function handleFile(file: File) {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = "";
        if (isExcel) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          text = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          text = String(e.target?.result ?? "");
        }

        const ddp = parseDDPFile(file.name, text, vehicles);
        onUploadDDP(ddp);
        setUploadMsg(`✓ Đã nhập ${ddp.id} (${ddp.totalQty} xe, ${ddp.items.length} MTOC)`);
        setTimeout(() => setUploadMsg(null), 4000);
      } catch (e) {
        setUploadMsg(`✗ Lỗi đọc file: ${(e as Error).message}`);
        setTimeout(() => setUploadMsg(null), 5000);
      }
    };
    
    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  return (
    <aside className="space-y-4">
      {/* Global Search Form */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Tra cứu xe độc lập</h3>
          <p className="text-[10px] text-muted-foreground">Định vị nhanh xe trong kho (VD: theo VIN)</p>
        </div>
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Model --</option>
              {uniqueModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={searchColor}
              onChange={(e) => setSearchColor(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Color --</option>
              {uniqueColors.map((c) => {
                const colorDef = COLORS.find(col => col.code === c);
                return <option key={c} value={c}>{c} {colorDef ? `(${colorDef.name})` : ""}</option>;
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Type --</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t || "(Trống)"}</option>
              ))}
            </select>
            <select
              value={searchOption}
              onChange={(e) => setSearchOption(e.target.value)}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Option --</option>
              {uniqueOptions.map((o) => (
                <option key={o} value={o}>{o || "(Trống)"}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Tìm theo số VIN..."
            value={searchVin}
            onChange={(e) => setSearchVin(e.target.value)}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Tìm trên Map
          </button>
        </form>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Upload đơn hàng</h3>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
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
          Hỗ trợ: .xlsx, .csv (UTF-8). Cột:{" "}
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
    const modelCode = (cells[iModel] ?? "").trim();
    const typeCode = (cells[iType] ?? "").trim();
    const optionCode = iOption >= 0 ? (cells[iOption] ?? "").trim() : "";
    const colorCode = (cells[iColor] ?? "").trim();
    const qty = parseInt(cells[iQty] ?? "0", 10) || 0;
    if (!modelCode || !colorCode || qty <= 0) continue;
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
