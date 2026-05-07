import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  FileWarning,
  Square,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { KISnapshot, PhieuKiemKe } from "@/lib/warehouse/types";

type DashboardStatus = "CHUA_KIEM_TRA" | "DANG_KIEM_TRA" | "DA_CHOT" | "DA_CHOT_CO_PHU_LUC";

interface Props {
  kiSnapshot: KISnapshot;
  phieuList: PhieuKiemKe[];
  onClose: () => void;
  onOpenPhieu: (phieuNo: string) => void;
}

function deriveStatus(phieu: PhieuKiemKe): DashboardStatus {
  if (phieu.status === "DA_CHOT" && phieu.adjustmentAppendix) return "DA_CHOT_CO_PHU_LUC";
  if (phieu.status === "DA_CHOT") return "DA_CHOT";
  if (phieu.status === "DANG_KIEM_TRA") return "DANG_KIEM_TRA";
  return "CHUA_KIEM_TRA";
}

const STATUS_STYLE: Record<
  DashboardStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  CHUA_KIEM_TRA: {
    label: "Chờ kiểm tra",
    className: "bg-slate-100 text-slate-600",
    icon: <Square className="h-3 w-3" />,
  },
  DANG_KIEM_TRA: {
    label: "Đang kiểm tra",
    className: "bg-amber-100 text-amber-700",
    icon: <ClipboardList className="h-3 w-3" />,
  },
  DA_CHOT: {
    label: "Đã chốt",
    className: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  DA_CHOT_CO_PHU_LUC: {
    label: "Đã chốt + phụ lục",
    className: "bg-red-100 text-red-700",
    icon: <FileWarning className="h-3 w-3" />,
  },
};

export function KIDashboard({ kiSnapshot, phieuList, onClose, onOpenPhieu }: Props) {
  const rows = phieuList.map((phieu) => ({
    phieu,
    status: deriveStatus(phieu),
  }));

  const totalMTOC = rows.length;
  const daChot = rows.filter((row) => row.phieu.status === "DA_CHOT").length;
  const dangKiemTra = rows.filter((row) => row.phieu.status === "DANG_KIEM_TRA").length;
  const chuaKiemTra = rows.filter((row) => row.phieu.status === "CHUA_KIEM_TRA").length;
  const coPhuLuc = rows.filter((row) => row.phieu.adjustmentAppendix !== null).length;
  const progressPct = totalMTOC > 0 ? Math.round((daChot / totalMTOC) * 100) : 0;

  function handleExport() {
    const summaryRows = rows.map(({ phieu, status }) => ({
      "Số phiếu": phieu.phieuNo,
      "Kỳ kiểm kê": kiSnapshot.periodLabel,
      "Thời điểm chốt": kiSnapshot.createdAt,
      "Mã MTOC": phieu.mtocKey,
      "Tên xe": phieu.modelName,
      "Mã P/L": phieu.modelCode,
      "Màu xe": `${phieu.colorCode} - ${phieu.colorName}`,
      Block: phieu.maBlock,
      "Số lượng hệ thống": phieu.systemQty,
      "Phân bổ vị trí": phieu.locationCounts
        .map((item) => `${item.location}: ${item.qty}`)
        .join("; "),
      "Xe được chọn kiểm tra": phieu.inspectionList.length,
      "Số xe khớp": phieu.inspectionList.filter((item) => item.ketQua === "KHOP").length,
      "Số xe không khớp": phieu.inspectionList.filter((item) => item.ketQua === "KHONG_KHOP")
        .length,
      "Loại chênh lệch": phieu.adjustmentAppendix?.loaiChenhLech ?? "",
      "Số lượng chênh lệch": phieu.adjustmentAppendix?.soLuong ?? "",
      "Số lượng sau điều chỉnh": phieu.adjustmentAppendix?.soLuongSauDieuChinh ?? "",
      "Lý do điều chỉnh": phieu.adjustmentAppendix?.lyDo ?? "",
      "Người lập phụ lục": phieu.adjustmentAppendix?.nguoiLap ?? "",
      "Người đếm": phieu.nguoiDem,
      "Xác nhận kho": phieu.nguoiXacNhan,
      Auditor: phieu.auditorName,
      "Trạng thái": STATUS_STYLE[status].label,
      "Ghi chú": phieu.note,
      "Đã chốt lúc": phieu.confirmedAt ?? "",
    }));

    const inspectionRows = rows.flatMap(({ phieu }) =>
      phieu.inspectionList.map((item) => ({
        "Số phiếu": phieu.phieuNo,
        VIN: item.vin,
        "Khu vực": item.location,
        "Nhập kho": item.arrivedAt,
        "Cập nhật cuối": item.lastHistoryAt,
        "Kết quả": item.ketQua ?? "",
        "Ghi chú": item.ghiChu,
        "Thời điểm kiểm": item.checkedAt ?? "",
      })),
    );

    const vehicleRows = rows.flatMap(({ phieu }) =>
      phieu.frameRecords.map((item) => ({
        "Số phiếu": phieu.phieuNo,
        "Mã MTOC": phieu.mtocKey,
        VIN: item.vin,
        "Trạng thái xe": item.status,
        "Khu vực": item.location,
        Zone: item.zoneId ?? "",
        Lane: item.laneId ?? "",
        "Nhập kho": item.arrivedAt,
        "Cập nhật cuối": item.lastHistoryAt,
      })),
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Tổng hợp");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inspectionRows), "Kiểm tra thực địa");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vehicleRows), "Danh sách số khung");
    XLSX.writeFile(wb, `${kiSnapshot.id}-bao-cao-kiem-ke.xlsx`);
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-5xl flex-col bg-card shadow-2xl">
        <header className="border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Báo cáo kiểm kê hệ thống</h2>
                <p className="text-xs text-muted-foreground">
                  {kiSnapshot.periodLabel} - snapshot {kiSnapshot.createdAt}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            <SummaryCard value={totalMTOC} label="Phiếu MTOC" tone="text-foreground" />
            <SummaryCard value={kiSnapshot.totalQty} label="Tổng xe" tone="text-blue-700" />
            <SummaryCard value={daChot} label="Đã chốt" tone="text-emerald-700" />
            <SummaryCard
              value={dangKiemTra + chuaKiemTra}
              label="Chưa xong"
              tone="text-amber-700"
            />
            <SummaryCard value={coPhuLuc} label="Phụ lục" tone="text-red-700" />
          </div>

          <div className="mt-3">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="flex h-full items-center justify-center bg-emerald-600 text-[9px] font-bold text-white transition-all"
                style={{ width: `${Math.max(progressPct, 3)}%` }}
              >
                {progressPct}%
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {coPhuLuc > 0 && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50/50 p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                Phiếu có phụ lục điều chỉnh ({coPhuLuc})
              </h4>
              <div className="space-y-1.5">
                {rows
                  .filter((row) => row.phieu.adjustmentAppendix !== null)
                  .map(({ phieu }) => (
                    <button
                      key={phieu.phieuNo}
                      type="button"
                      onClick={() => onOpenPhieu(phieu.phieuNo)}
                      className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-xs transition-colors hover:bg-red-50"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="font-semibold text-foreground">{phieu.modelName}</span>
                      <span className="text-muted-foreground">{phieu.colorName}</span>
                      <span className="rounded bg-red-100 px-1.5 py-0.5 font-bold text-red-700">
                        {phieu.adjustmentAppendix?.loaiChenhLech}{" "}
                        {phieu.adjustmentAppendix?.soLuong}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {phieu.adjustmentAppendix?.lyDo}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Phiếu / MTOC</th>
                  <th className="px-3 py-2 text-left">Block</th>
                  <th className="px-3 py-2 text-right">SL hệ thống</th>
                  <th className="px-3 py-2 text-right">Xe kiểm tra</th>
                  <th className="px-3 py-2 text-right">Không khớp</th>
                  <th className="px-3 py-2 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ phieu, status }) => {
                  const badge = STATUS_STYLE[status];
                  const khongKhop = phieu.inspectionList.filter(
                    (item) => item.ketQua === "KHONG_KHOP",
                  ).length;
                  return (
                    <tr
                      key={phieu.phieuNo}
                      className={`cursor-pointer border-t transition-colors hover:bg-muted/50 ${
                        phieu.adjustmentAppendix ? "bg-red-50/40" : ""
                      }`}
                      onClick={() => onOpenPhieu(phieu.phieuNo)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-foreground">{phieu.phieuNo}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {phieu.modelName} - {phieu.colorName}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{phieu.maBlock}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{phieu.systemQty}</td>
                      <td className="px-3 py-2.5 text-right">{phieu.inspectionList.length}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={
                            khongKhop > 0 ? "font-semibold text-red-600" : "text-emerald-600"
                          }
                        >
                          {khongKhop}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="border-t p-4">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Xuất báo cáo kiểm kê
          </button>
        </footer>
      </aside>
    </div>
  );
}

function SummaryCard({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 text-center shadow-sm">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
