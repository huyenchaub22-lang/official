import { useMemo, useState } from "react";
import { CheckCircle2, Download, MapPin, Package, X, Maximize2, Minimize2 } from "lucide-react";
import type { DDP, Vehicle, PickContext } from "@/lib/warehouse/types";

interface Props {
  ddp: DDP | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onComplete: (ddpId: string) => void;
  activePickLine: PickContext | null;
  onStartPick: (ctx: PickContext) => void;
}

export function DDPDetailPanel({
  ddp,
  vehicles,
  onClose,
  onComplete,
  activePickLine,
  onStartPick,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  const totalSelected = useMemo(
    () => (ddp ? ddp.items.reduce((s, it) => s + it.selectedVins.length, 0) : 0),
    [ddp]
  );

  if (!ddp) return null;
  const progressPct = Math.round((totalSelected / ddp.totalQty) * 100);

  // Auto minimize if picking a line in this DDP
  const showMinimized = isMinimized || (activePickLine?.ddpId === ddp.id && isMinimized !== false);

  if (showMinimized) {
    return (
      <div className="fixed right-6 top-24 z-40 w-80 rounded-xl border bg-card shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{ddp.id}</span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Mở rộng"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Đã pick: {totalSelected}/{ddp.totalQty}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl transition-all">
        <header className="border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{ddp.id}</h2>
                <p className="text-xs text-muted-foreground">
                  Nhà vận tải: <span className="font-medium text-foreground">{ddp.carrier}</span> ·
                  Tạo: {ddp.createdAt}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Thu gọn
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Stat label="TỔNG XE" value={ddp.totalQty} tone="text-foreground" />
            <Stat label="MTOC" value={ddp.items.length} tone="text-blue-600" />
            <Stat label="ĐÃ CHỌN" value={totalSelected} tone="text-emerald-600" />
            <Stat label="CÒN THIẾU" value={ddp.totalQty - totalSelected} tone="text-orange-600" />
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Tiến độ: {progressPct}%</span>
              <span>Bạn có thể thu gọn bảng này để xem Layout dễ hơn.</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Danh sách MTOC cần lấy ({ddp.items.length})
          </div>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Model · Màu</th>
                  <th className="px-3 py-2 text-right">SL</th>
                  <th className="px-3 py-2 text-right">Đã chọn</th>
                  <th className="px-3 py-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {ddp.items.map((it) => {
                  const isPicking = activePickLine?.lineId === it.id;
                  return (
                    <tr key={it.id} className={`border-t ${isPicking ? "bg-violet-50" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-1 inline-block h-3 w-3 rounded-full border shadow-sm"
                            style={{ backgroundColor: it.colorHex }}
                          />
                          <div>
                            <div className="font-semibold text-foreground">
                              {it.modelName} · {it.colorName}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {it.modelCode} {it.typeCode} / {it.optionCode || "(option trống)"} / {it.colorCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-foreground">{it.qty}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={
                            it.selectedVins.length === it.qty
                              ? "font-semibold text-emerald-600"
                              : "text-muted-foreground"
                          }
                        >
                          {it.selectedVins.length}/{it.qty}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onStartPick({
                              ddpId: ddp.id,
                              lineId: it.id,
                              modelCode: it.modelCode,
                              colorCode: it.colorCode,
                              modelName: it.modelName,
                              colorName: it.colorName,
                              qty: it.qty,
                            });
                            setIsMinimized(true);
                          }}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                            isPicking
                              ? "bg-violet-600 text-white hover:bg-violet-700"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isPicking ? "Đang tìm..." : "Tìm trên Layout"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t p-4">
          <button
            type="button"
            onClick={() => exportDDPToCSV(ddp, vehicles)}
            disabled={totalSelected === 0}
            className="flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export CSV ({totalSelected})
          </button>
          <button
            type="button"
            onClick={() => {
              if (ddp.status === "done") return;
              if (
                window.confirm(`Hoàn thành ${ddp.id}? Các xe đã chọn sẽ được đánh dấu xuất kho.`)
              ) {
                onComplete(ddp.id);
                onClose();
              }
            }}
            disabled={totalSelected < ddp.totalQty || ddp.status === "done"}
            className="flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
          >
            <CheckCircle2 className="h-4 w-4" />
            {ddp.status === "done" ? "Đã hoàn thành" : "Hoàn thành đơn hàng"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function exportDDPToCSV(ddp: DDP, vehicles: Vehicle[]) {
  const vinMap = new Map(vehicles.map((v) => [v.vin, v]));
  const rows: string[] = [];
  rows.push(
    [
      "DDP_ID",
      "CARRIER",
      "LINE_ID",
      "MODEL_CODE",
      "TYPE_CODE",
      "OPTION_CODE",
      "COLOR_CODE",
      "COLOR_NAME",
      "VIN",
      "ACTUAL_ZONE",
      "ACTUAL_LANE",
      "ARRIVED_AT",
    ].join(",")
  );
  ddp.items.forEach((it) => {
    it.selectedVins.forEach((vin) => {
      const v = vinMap.get(vin);
      const zone = v?.zoneId ?? "";
      const lane = v?.laneId ?? "";
      const arrived = v?.arrivedAt ?? "";
      rows.push(
        [
          ddp.id,
          ddp.carrier,
          it.id,
          it.modelCode,
          it.typeCode,
          it.optionCode,
          it.colorCode,
          it.colorName,
          vin,
          zone,
          lane,
          arrived,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      );
    });
  });
  const csv = rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ddp.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border bg-background p-2.5 text-center shadow-sm">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
