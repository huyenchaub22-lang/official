import { useMemo, useState } from "react";
import { CheckCircle2, Download, MapPin, Package, Sparkles, X } from "lucide-react";
import type { DDP, DDPLineItem, Vehicle } from "@/lib/warehouse/types";

interface Props {
  ddp: DDP | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onToggleVin: (ddpId: string, lineId: string, vin: string) => void;
  onClearLine: (ddpId: string, lineId: string) => void;
  onAutoSelect: (ddpId: string, lineId: string) => void;
  onComplete: (ddpId: string) => void;
}

export function DDPDetailPanel({ ddp, vehicles, onClose, onToggleVin, onClearLine, onAutoSelect, onComplete }: Props) {
  const [tab, setTab] = useState<"overview" | "pick">("overview");
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  const totalSelected = useMemo(
    () => (ddp ? ddp.items.reduce((s, it) => s + it.selectedVins.length, 0) : 0),
    [ddp],
  );

  if (!ddp) return null;
  const progressPct = Math.round((totalSelected / ddp.totalQty) * 100);
  const activeLine = ddp.items.find((i) => i.id === activeLineId) ?? ddp.items[0];

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl">
        <header className="border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{ddp.id}</h2>
                <p className="text-xs text-muted-foreground">
                  Nhà vận tải: <span className="font-medium text-foreground">{ddp.carrier}</span> · Tạo: {ddp.createdAt}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Stat label="TỔNG XE" value={ddp.totalQty} tone="text-foreground" />
            <Stat label="MTOC" value={ddp.items.length} tone="text-blue-600" />
            <Stat label="ĐÃ CHỌN" value={totalSelected} tone="text-emerald-600" />
            <Stat label="CÒN THIẾU" value={ddp.totalQty - totalSelected} tone="text-orange-600" />
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Tiến độ: {progressPct}%</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={<Package className="h-4 w-4" />}>
              Tổng quan đơn hàng
            </TabBtn>
            <TabBtn active={tab === "pick"} onClick={() => setTab("pick")} icon={<CheckCircle2 className="h-4 w-4" />}>
              Chọn xe ({totalSelected}/{ddp.totalQty})
            </TabBtn>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {tab === "overview" ? (
            <OverviewTab ddp={ddp} onJumpPick={(lineId) => { setTab("pick"); setActiveLineId(lineId); }} />
          ) : (
            <PickTab
              ddp={ddp}
              vehicles={vehicles}
              activeLineId={activeLine.id}
              setActiveLineId={setActiveLineId}
              onToggleVin={onToggleVin}
              onClearLine={onClearLine}
              onAutoSelect={onAutoSelect}
            />
          )}
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
              if (window.confirm(`Hoàn thành ${ddp.id}? Các xe đã chọn sẽ được đánh dấu xuất kho.`)) {
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
    ].join(","),
  );
  // Chỉ export các xe ĐÃ được chọn — đúng VIN, đúng zone/lane thực tế.
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
          .join(","),
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
    <div className="rounded-lg border bg-background p-2.5 text-center">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function OverviewTab({ ddp, onJumpPick }: { ddp: DDP; onJumpPick: (lineId: string) => void }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Chi tiết đơn hàng — {ddp.items.length} dòng MTOC
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
            {ddp.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: it.colorHex }} />
                    <div>
                      <div className="font-semibold text-foreground">
                        {it.modelName} · {it.colorName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {it.modelCode} {it.typeCode} / {it.optionCode || "(option trống)"} / {it.colorCode}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        Gợi ý lấy ở:
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 font-medium text-violet-800">
                          <MapPin className="h-2.5 w-2.5" />
                          {it.suggestedZoneId}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-foreground">{it.qty} xe</td>
                <td className="px-3 py-2.5 text-right">
                  <span className={it.selectedVins.length === it.qty ? "font-semibold text-emerald-600" : "text-muted-foreground"}>
                    {it.selectedVins.length}/{it.qty}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onJumpPick(it.id)}
                    className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Chọn
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PickTab({
  ddp,
  vehicles,
  activeLineId,
  setActiveLineId,
  onToggleVin,
  onClearLine,
  onAutoSelect,
}: {
  ddp: DDP;
  vehicles: Vehicle[];
  activeLineId: string;
  setActiveLineId: (id: string) => void;
  onToggleVin: (ddpId: string, lineId: string, vin: string) => void;
  onClearLine: (ddpId: string, lineId: string) => void;
  onAutoSelect: (ddpId: string, lineId: string) => void;
}) {
  const activeLine = ddp.items.find((i) => i.id === activeLineId)!;
  const candidates = useMemo(
    () =>
      vehicles
        .filter(
          (v) =>
            v.status === "in_zone" &&
            v.modelCode === activeLine.modelCode &&
            v.colorCode === activeLine.colorCode,
        )
        .sort((a, b) => {
          const aPriority = a.zoneId === activeLine.suggestedZoneId ? 0 : 1;
          const bPriority = b.zoneId === activeLine.suggestedZoneId ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.arrivedAt.localeCompare(b.arrivedAt);
        }),
    [vehicles, activeLine],
  );

  // group candidates by zone+lane
  const grouped = useMemo(() => {
    const map = new Map<string, Vehicle[]>();
    candidates.forEach((v) => {
      const key = `${v.zoneId}|${v.laneId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return Array.from(map.entries()).map(([key, vs]) => {
      const [zoneId, laneId] = key.split("|");
      return { zoneId, laneId, vehicles: vs };
    });
  }, [candidates]);

  return (
    <div>
      {/* Tabs for line items */}
      <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
        {ddp.items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setActiveLineId(it.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              it.id === activeLineId
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: it.colorHex }} />
            {it.modelName} ({it.selectedVins.length}/{it.qty})
          </button>
        ))}
      </div>

      <LineHeader
        item={activeLine}
        suggestionCount={candidates.length}
        onAuto={() => onAutoSelect(ddp.id, activeLine.id)}
        onClear={() => onClearLine(ddp.id, activeLine.id)}
      />

      <div className="mt-4 space-y-4">
        {grouped.map(({ zoneId, laneId, vehicles: vs }) => {
          const laneSuffix = laneId?.split("-L")[1] ?? "?";
          const pickedInLane = vs.filter((v) => activeLine.selectedVins.includes(v.vin)).length;
          return (
            <div key={`${zoneId}-${laneId}`} className="rounded-lg border">
              <div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-violet-600" />
                  <span className="font-semibold text-foreground">{zoneId} · Làn L{laneSuffix}</span>
                  <span className="text-muted-foreground">· {vs.length} xe gợi ý</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Đã chọn: <span className="font-semibold text-emerald-600">{pickedInLane}/{vs.length}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // toggle all in lane: if all selected -> unselect all; else select all
                      const allSelected = pickedInLane === vs.length;
                      vs.forEach((v) => {
                        const isSel = activeLine.selectedVins.includes(v.vin);
                        if (allSelected && isSel) onToggleVin(ddp.id, activeLine.id, v.vin);
                        if (!allSelected && !isSel) onToggleVin(ddp.id, activeLine.id, v.vin);
                      });
                    }}
                    className="rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-muted"
                  >
                    {pickedInLane === vs.length ? "Bỏ cả làn" : "Chọn cả làn"}
                  </button>
                </div>
              </div>
              <ul className="divide-y">
                {vs.map((v, idx) => {
                  const isSelected = activeLine.selectedVins.includes(v.vin);
                  return (
                    <li key={v.vin} className={`flex items-center justify-between px-3 py-2 ${isSelected ? "bg-emerald-50" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-mono text-xs text-foreground">{v.vin}</div>
                          <div className="text-[10px] text-muted-foreground">Nhập {v.arrivedAt.split(" ")[1]}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleVin(ddp.id, activeLine.id, v.vin)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {isSelected ? "Bỏ chọn" : "Chọn"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {grouped.length === 0 && (
          <div className="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
            Không tìm thấy xe phù hợp trong layout cho MTOC này.
          </div>
        )}
      </div>
    </div>
  );
}

function LineHeader({
  item,
  suggestionCount,
  onAuto,
  onClear,
}: {
  item: DDPLineItem;
  suggestionCount: number;
  onAuto: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: item.colorHex }} />
            <span className="font-semibold text-foreground">
              {item.modelName} · {item.colorName}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {item.modelCode} {item.typeCode} / {item.optionCode || "(option trống)"} / {item.colorCode}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Yêu cầu: {item.qty} xe</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
              Gợi ý: {suggestionCount} xe
            </span>
            <span className={`rounded-full px-2 py-0.5 font-medium ${item.selectedVins.length === item.qty ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              Đã chọn: {item.selectedVins.length}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onAuto}
            className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Hệ thống tự chọn
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={item.selectedVins.length === 0}
            className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            Bỏ chọn tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
