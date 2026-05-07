import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Play,
  Plus,
  SearchCheck,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Vehicle, PhieuKiemKe } from "@/lib/warehouse/types";
import type { KIState } from "@/lib/warehouse/useKIState";

interface Props {
  kiState: KIState;
  vehicles: Vehicle[];
  onOpenPhieu: (phieuNo: string) => void;
  onOpenDashboard: () => void;
}

export function KISidebar({ kiState, vehicles, onOpenPhieu, onOpenDashboard }: Props) {
  const {
    kiMode,
    kiSnapshot,
    phieuList,
    startKI,
    createPhieu,
    createAllPhieu,
  } = kiState;

  const [selectedModel, setSelectedModel] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  if (!kiMode || !kiSnapshot) {
    const systemQty = vehicles.filter((vehicle) => vehicle.status !== "picked").length;

    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Kiểm kê tồn kho</h3>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
          Sau khi dừng nhập kho và xuất kho để bắt đầu kiểm kê, bấm nút bên dưới để hệ thống chốt
          dữ liệu tồn và mở đợt kiểm kê.
        </p>
        <div className="mb-3 rounded-lg border bg-background px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Xe đang tồn trên hệ thống</span>
            <span className="font-bold text-foreground">{systemQty}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const ts = new Date().toLocaleString("vi-VN");
            if (
              window.confirm(
                `Xác nhận đã dừng nhập/xuất kho và chốt số kiểm kê tại ${ts}? Dữ liệu hiện tại sẽ được freeze cho toàn bộ đợt kiểm kê.`,
              )
            ) {
              startKI(vehicles);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700"
        >
          <Play className="h-4 w-4" />
          Bắt đầu kiểm kê
        </button>
      </section>
    );
  }

  const items = kiSnapshot.items;
  const modelOptions = uniqueSorted(items.map((item) => item.modelCode));
  const typeOptions = uniqueSorted(
    items
      .filter((item) => !selectedModel || item.modelCode === selectedModel)
      .map((item) => item.typeCode),
  );
  const optionOptions = uniqueSorted(
    items
      .filter(
        (item) =>
          (!selectedModel || item.modelCode === selectedModel) &&
          (!selectedType || item.typeCode === selectedType),
      )
      .map((item) => item.optionCode),
  );
  const colorOptions = uniqueSorted(
    items
      .filter(
        (item) =>
          (!selectedModel || item.modelCode === selectedModel) &&
          (!selectedType || item.typeCode === selectedType) &&
          (!selectedOption || item.optionCode === selectedOption),
      )
      .map((item) => item.colorCode),
  );

  const filteredItems = items.filter(
    (item) =>
      (!selectedModel || item.modelCode === selectedModel) &&
      (!selectedType || item.typeCode === selectedType) &&
      (!selectedOption || item.optionCode === selectedOption) &&
      (!selectedColor || item.colorCode === selectedColor),
  );

  const exactItem = filteredItems.length === 1 ? filteredItems[0] : null;
  const daChot = phieuList.filter((phieu) => phieu.status === "DA_CHOT").length;
  const dangKiemTra = phieuList.filter((phieu) => phieu.status === "DANG_KIEM_TRA").length;
  const coPhuLuc = phieuList.filter((phieu) => phieu.adjustmentAppendix !== null).length;

  return (
    <section className="rounded-2xl border border-orange-200 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Đợt kiểm kê đang mở</h3>
        </div>
        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <BarChart3 className="h-3 w-3" />
          Báo cáo
        </button>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        <MiniStat value={kiSnapshot.items.length} label="MTOC" tone="text-foreground" />
        <MiniStat value={kiSnapshot.totalQty} label="Tổng xe" tone="text-blue-700" />
        <MiniStat value={daChot} label="Đã chốt" tone="text-emerald-600" />
        <MiniStat value={coPhuLuc} label="Phụ lục" tone="text-red-600" />
      </div>

      <div className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{kiSnapshot.periodLabel}</span>
          <span className="font-medium text-foreground">{kiSnapshot.createdAt}</span>
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          Có thể tạo phiếu theo bộ lọc thật từ snapshot, hoặc để hệ thống tự tạo toàn bộ phiếu theo từng MTOC.
        </div>
      </div>

      <div className="mb-3 rounded-xl border bg-muted/20 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tạo phiếu thủ công theo bộ lọc
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Model" value={selectedModel} onChange={setSelectedModel} options={modelOptions} />
          <SelectField label="Type" value={selectedType} onChange={setSelectedType} options={typeOptions} />
          <SelectField
            label="Option"
            value={selectedOption}
            onChange={setSelectedOption}
            options={optionOptions}
          />
          <SelectField label="Color" value={selectedColor} onChange={setSelectedColor} options={colorOptions} />
        </div>
        <div className="mt-2 rounded-lg bg-background px-3 py-2 text-xs">
          {exactItem
            ? `MTOC khớp: ${exactItem.modelName} - ${exactItem.colorName} - ${exactItem.qty} xe`
            : `Đang có ${filteredItems.length} MTOC khớp bộ lọc.`}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={!exactItem}
            onClick={() => exactItem && createPhieu(exactItem.mtocKey)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Tạo phiếu
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedModel("");
              setSelectedType("");
              setSelectedOption("");
              setSelectedColor("");
            }}
            className="rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={createAllPhieu}
        className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <WandSparkles className="h-3.5 w-3.5" />
        Hệ thống tự động tạo phiếu theo từng MTOC
      </button>

      <div className="mb-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${phieuList.length > 0 ? Math.round((daChot / phieuList.length) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {daChot}/{phieuList.length} phiếu đã chốt
          </span>
          <span>{dangKiemTra} phiếu đang kiểm tra</span>
        </div>
      </div>

      <div className="space-y-1.5" style={{ maxHeight: 420, overflowY: "auto" }}>
        {phieuList.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background px-3 py-4 text-center text-xs text-muted-foreground">
            Chưa có phiếu nào. Hãy tạo phiếu theo bộ lọc hoặc bấm tự động tạo toàn bộ theo MTOC.
          </div>
        ) : (
          phieuList.map((phieu) => (
            <PhieuRow key={phieu.phieuNo} phieu={phieu} onOpen={() => onOpenPhieu(phieu.phieuNo)} />
          ))
        )}
      </div>
    </section>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function MiniStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-1.5 py-1 text-center">
      <div className={`text-sm font-bold ${tone}`}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-[11px]">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
      >
        <option value="">-- Chọn --</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "(Trống)"}
          </option>
        ))}
      </select>
    </label>
  );
}

function PhieuRow({ phieu, onOpen }: { phieu: PhieuKiemKe; onOpen: () => void }) {
  const badge = (() => {
    if (phieu.status === "DA_CHOT" && phieu.adjustmentAppendix) {
      return (
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-700">
          <FileWarning className="mr-0.5 inline h-2.5 w-2.5" />
          Đã chốt + phụ lục
        </span>
      );
    }

    if (phieu.status === "DA_CHOT") {
      return (
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
          <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />
          Hoàn thành
        </span>
      );
    }

    if (phieu.status === "DANG_KIEM_TRA") {
      return (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
          <SearchCheck className="mr-0.5 inline h-2.5 w-2.5" />
          Đang kiểm tra
        </span>
      );
    }

    return (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
        Chờ thanh tra
      </span>
    );
  })();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-lg border bg-background p-2 text-left transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">
            {phieu.modelName} - {phieu.colorName}
          </div>
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {phieu.modelCode} / {phieu.typeCode || "-"} / {phieu.optionCode || "-"} - {phieu.systemQty} xe
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="truncate">Block: {phieu.maBlock}</span>
        <span>{phieu.inspectionList.length} VIN thanh tra</span>
      </div>
    </button>
  );
}
