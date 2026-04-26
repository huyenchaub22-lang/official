import { FileSpreadsheet, Search, Upload } from "lucide-react";
import type { DDP } from "@/lib/warehouse/types";

interface SidebarProps {
  ddps: DDP[];
  onOpenDDP: (id: string) => void;
  activeDDPId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const STATUS_LABEL: Record<DDP["status"], string> = {
  waiting: "Chờ",
  processing: "Xử lý",
  done: "Xong",
};

const STATUS_TONE: Record<DDP["status"], string> = {
  waiting: "bg-muted text-muted-foreground",
  processing: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
};

export function Sidebar({ ddps, onOpenDDP, activeDDPId, searchQuery, setSearchQuery }: SidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Tìm xe (VIN / MTOC)</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="VIN, model, màu, type..."
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Upload DDP plan</h3>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-background py-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Upload className="h-4 w-4" />
          Click để upload
        </button>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          .xlsx / .xls / .csv (UTF-16 tab cũng OK). Cột nhận diện:{" "}
          <code className="rounded bg-muted px-1">MODEL_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">TYPE_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">OPTION_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">COLOR_CODE</code>,{" "}
          <code className="rounded bg-muted px-1">QTY</code>,{" "}
          <code className="rounded bg-muted px-1">TRANS_CODE</code>
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <a className="text-primary underline-offset-2 hover:underline" href="#">Mẫu NKV (30)</a>
          <span className="text-muted-foreground">·</span>
          <a className="text-primary underline-offset-2 hover:underline" href="#">Mẫu PA (40)</a>
          <span className="text-muted-foreground">·</span>
          <a className="text-primary underline-offset-2 hover:underline" href="#">Mẫu VTC (50)</a>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Danh sách DDP ({ddps.length})
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
                <div className="mt-1 text-[10px] text-muted-foreground">{totalSel}/{d.totalQty} đã chọn</div>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
