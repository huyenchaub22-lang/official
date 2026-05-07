import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  LocateFixed,
  Lock,
  MapPin,
  SearchCheck,
  Trash2,
  X,
} from "lucide-react";
import type { LoaiChenhLech, PhieuKiemKe, Vehicle, VehicleStatus } from "@/lib/warehouse/types";
import type { KIState } from "@/lib/warehouse/useKIState";
import { PhieuPrintView } from "./PhieuPrintView";

interface Props {
  phieu: PhieuKiemKe | null;
  kiState: KIState;
  vehiclesByVin: Map<string, Vehicle>;
  onLocateVin: (vin: string) => void;
  onClose: () => void;
}

export function PhieuDetailPanel({
  phieu,
  kiState,
  vehiclesByVin,
  onLocateVin,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"phieu" | "kiem-tra" | "phu-luc">("phieu");

  if (!phieu) return null;

  const isLocked = phieu.status === "DA_CHOT";
  const soXeKhop = phieu.inspectionList.filter((item) => item.ketQua === "KHOP").length;
  const soXeKhongKhop = phieu.inspectionList.filter((item) => item.ketQua === "KHONG_KHOP").length;
  const soXeChuaDanhDau = phieu.inspectionList.filter((item) => item.ketQua === null).length;
  const ketQuaOK =
    phieu.soLuongThanhTra === phieu.systemQty &&
    phieu.inspectionList.length >= 10 &&
    phieu.inspectionList.every(
      (item) => item.ketQua === "KHOP" && item.systemFound && item.belongsToPhieu,
    );

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[1120px] flex-col bg-card shadow-2xl">
        <header className="border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isLocked ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                }`}
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{phieu.phieuNo}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isLocked ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {statusLabel(phieu)}
                  </span>
                  {phieu.adjustmentAppendix && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                      Có phụ lục điều chỉnh
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      ketQuaOK ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {ketQuaOK ? "Thanh tra OK" : "Thanh tra cần đối soát"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {phieu.modelName} - {phieu.modelCode} - {phieu.colorName} - Block {phieu.maBlock}
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
            <StatBox label="SL hệ thống" value={phieu.systemQty} tone="text-foreground" />
            <StatBox
              label="SL thanh tra"
              value={phieu.soLuongThanhTra ?? "—"}
              tone={phieu.soLuongThanhTra === phieu.systemQty ? "text-emerald-600" : "text-orange-700"}
            />
            <StatBox label="VIN thanh tra" value={phieu.inspectionList.length} tone="text-blue-700" />
            <StatBox label="Khớp" value={soXeKhop} tone="text-emerald-600" />
            <StatBox label="Không khớp" value={soXeKhongKhop} tone="text-red-600" />
          </div>

          {soXeChuaDanhDau > 0 && phieu.inspectionList.length > 0 && !isLocked && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Còn {soXeChuaDanhDau} VIN trong danh sách thanh tra chưa đánh dấu kết quả.
            </div>
          )}

          <div className="mt-3 flex gap-1 border-b">
            <TabBtn active={activeTab === "phieu"} onClick={() => setActiveTab("phieu")}>
              Phiếu kiểm kê
            </TabBtn>
            <TabBtn active={activeTab === "kiem-tra"} onClick={() => setActiveTab("kiem-tra")}>
              Kiểm tra thực địa
            </TabBtn>
            <TabBtn active={activeTab === "phu-luc"} onClick={() => setActiveTab("phu-luc")}>
              Phụ lục điều chỉnh
            </TabBtn>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === "phieu" && <PhieuInfoTab phieu={phieu} kiState={kiState} />}
          {activeTab === "kiem-tra" && (
            <KiemTraTab
              phieu={phieu}
              kiState={kiState}
              vehiclesByVin={vehiclesByVin}
              onLocateVin={onLocateVin}
            />
          )}
          {activeTab === "phu-luc" && <PhuLucTab phieu={phieu} kiState={kiState} />}
        </div>

        <footer className="border-t p-4">
          <div className="flex flex-wrap items-center gap-2">
            {!isLocked && (
              <button
                type="button"
                onClick={() => {
                  const coDu10VIN = phieu.inspectionList.length >= 10;
                  const coXeChuaDanhDau = phieu.inspectionList.some((item) => item.ketQua === null);
                  const appendixInvalid =
                    phieu.adjustmentAppendix &&
                    (!phieu.adjustmentAppendix.lyDo.trim() ||
                      !phieu.adjustmentAppendix.nguoiLap.trim() ||
                      phieu.adjustmentAppendix.soLuong <= 0);

                  if (!coDu10VIN) {
                    alert("Thanh tra phải kiểm tra tối thiểu 10 VIN bất kỳ trên toàn layout.");
                    return;
                  }
                  if (coXeChuaDanhDau) {
                    alert("Danh sách thanh tra còn VIN chưa đánh dấu kết quả.");
                    return;
                  }
                  if (appendixInvalid) {
                    alert("Phụ lục điều chỉnh chưa đủ thông tin.");
                    return;
                  }
                  if (
                    window.confirm(
                      `Chốt biên bản ${phieu.phieuNo}? Nếu thanh tra NG thì phụ lục điều chỉnh sẽ được đính kèm, snapshot đã chốt vẫn giữ nguyên.`,
                    )
                  ) {
                    kiState.confirmPhieu(phieu.phieuNo);
                  }
                }}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Chốt biên bản
              </button>
            )}
            {isLocked && <PhieuPrintView phieu={phieu} />}
            <div className="text-xs text-muted-foreground">
              {isLocked
                ? `Biên bản đã chốt lúc ${phieu.confirmedAt}.`
                : "Thanh tra đếm thực tế, tra tối thiểu 10 VIN trên toàn layout, sau đó mới chốt biên bản."}
            </div>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function PhieuInfoTab({ phieu, kiState }: { phieu: PhieuKiemKe; kiState: KIState }) {
  const isLocked = phieu.status === "DA_CHOT";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Thông tin hệ thống đã chốt
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Số phiếu" value={phieu.phieuNo} />
          <InfoField label="Kỳ" value={phieu.snapshotId} />
          <InfoField label="Mã Block" value={phieu.maBlock} />
          <InfoField label="Mã P/L" value={phieu.modelCode} />
          <InfoField label="Mã S/L" value={phieu.phieuNo} />
          <InfoField label="Mã quản lý" value={phieu.mtocKey} />
          <InfoField label="Đ/VT, phẩm" value="Chiếc" />
          <InfoField label="Cấp độ quản lý" value="MTOC" />
          <InfoField label="Mã phụ tùng" value={phieu.mtocKey} />
          <InfoField label="Màu sắc" value={`${phieu.colorCode} - ${phieu.colorName}`} />
          <InfoField label="Tên phụ tùng" value={phieu.modelName} />
          <InfoField label="Số phiếu kiểm kê" value={<strong>{phieu.systemQty}</strong>} />
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Chi tiết vị trí phân bổ
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {phieu.locationCounts.map((loc) => (
            <div
              key={loc.location}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {loc.location}
              </span>
              <strong>{loc.qty} xe</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
          Thông tin ký xác nhận
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <InputField
            label="Người đếm"
            value={phieu.nguoiDem}
            disabled={isLocked}
            onChange={(value) => kiState.updatePhieuField(phieu.phieuNo, { nguoiDem: value })}
          />
          <InputField
            label="Xác nhận"
            value={phieu.nguoiXacNhan}
            disabled={isLocked}
            onChange={(value) => kiState.updatePhieuField(phieu.phieuNo, { nguoiXacNhan: value })}
          />
          <InputField
            label="Auditor"
            value={phieu.auditorName}
            disabled={isLocked}
            onChange={(value) => kiState.updatePhieuField(phieu.phieuNo, { auditorName: value })}
          />
        </div>
        <div className="mt-3">
          <TextAreaField
            label="Ghi chú"
            value={phieu.note}
            disabled={isLocked}
            onChange={(value) => kiState.updatePhieuField(phieu.phieuNo, { note: value })}
          />
        </div>
      </div>
    </div>
  );
}

function KiemTraTab({
  phieu,
  kiState,
  vehiclesByVin,
  onLocateVin,
}: {
  phieu: PhieuKiemKe;
  kiState: KIState;
  vehiclesByVin: Map<string, Vehicle>;
  onLocateVin: (vin: string) => void;
}) {
  const isLocked = phieu.status === "DA_CHOT";
  const [searchVin, setSearchVin] = useState("");
  const [lastSearchVin, setLastSearchVin] = useState<string | null>(null);

  const normalizedSearchVin = searchVin.trim().toUpperCase();
  const foundVehicle = normalizedSearchVin ? (vehiclesByVin.get(normalizedSearchVin) ?? null) : null;
  const expectedFrame = normalizedSearchVin
    ? (phieu.frameRecords.find((item) => item.vin === normalizedSearchVin) ?? null)
    : null;
  const searchSummary = lastSearchVin
    ? phieu.inspectionList.find((item) => item.vin === lastSearchVin) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Thanh tra kiểm tra thực địa</h4>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tiêu chuẩn OK: số lượng thanh tra đếm được khớp phiếu kiểm kê, và tối thiểu 10 VIN bất kỳ
              tra trên toàn layout đều tồn tại đúng trên hệ thống, thuộc danh sách của phiếu này.
            </p>
          </div>
          <div className="rounded-lg border bg-background px-3 py-2 text-xs">
            Đã có <strong>{phieu.inspectionList.length}</strong> / 10 VIN thanh tra
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[220px_1fr_auto] gap-2">
          <InputField
            label="Số lượng thanh tra đếm thực tế"
            value={phieu.soLuongThanhTra === null ? "" : String(phieu.soLuongThanhTra)}
            disabled={isLocked}
            type="number"
            onChange={(value) =>
              kiState.updatePhieuField(phieu.phieuNo, {
                soLuongThanhTra: value === "" ? null : Math.max(0, parseInt(value, 10) || 0),
              })
            }
          />
          <InputField
            label="Tra VIN trên toàn layout"
            value={searchVin}
            disabled={isLocked}
            onChange={setSearchVin}
            placeholder="Nhập số VIN thanh tra đang nhìn thấy ngoài hiện trường..."
          />
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={isLocked || !normalizedSearchVin}
              onClick={() => {
                setLastSearchVin(normalizedSearchVin);
                kiState.addInspectionVin(phieu.phieuNo, normalizedSearchVin, foundVehicle);
              }}
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Thêm vào DS thanh tra
            </button>
            <button
              type="button"
              disabled={!foundVehicle}
              onClick={() => foundVehicle && onLocateVin(foundVehicle.vin)}
              className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Định vị trên map
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-lg border bg-background p-3 text-xs">
          {!normalizedSearchVin ? (
            <span className="text-muted-foreground">
              Thanh tra nhập VIN thực tế nhìn thấy ngoài hiện trường để đối chiếu với dữ liệu hệ thống.
            </span>
          ) : (
            <div className="space-y-1">
              <div>
                VIN tra cứu: <strong>{normalizedSearchVin}</strong>
              </div>
              <div>
                Kết quả hệ thống:{" "}
                <strong className={foundVehicle ? "text-emerald-700" : "text-red-700"}>
                  {foundVehicle ? "Tồn tại" : "Không tìm thấy"}
                </strong>
              </div>
              {foundVehicle && (
                <>
                  <div>
                    Vị trí hiện tại trên layout: <strong>{foundVehicle.zoneId ? `${foundVehicle.zoneId}/${foundVehicle.laneId?.split("-").pop() ?? ""}` : "Không ở layout"}</strong>
                  </div>
                  <div>
                    Thuộc danh sách MTOC của phiếu này:{" "}
                    <strong className={expectedFrame ? "text-emerald-700" : "text-red-700"}>
                      {expectedFrame ? "Có" : "Không"}
                    </strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {searchSummary && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3 text-xs">
            VIN <strong>{searchSummary.vin}</strong> đã được thêm vào danh sách thanh tra.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <SearchCheck className="h-4 w-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-foreground">Danh sách VIN thanh tra</h4>
        </div>

        {phieu.inspectionList.length === 0 ? (
          <div className="rounded-lg bg-white px-3 py-3 text-sm text-muted-foreground">
            Chưa có VIN nào được thanh tra chọn. Hãy tra VIN ngoài thực địa rồi thêm vào danh sách kiểm tra.
          </div>
        ) : (
          <div className="space-y-2">
            {phieu.inspectionList.map((item) => (
              <div key={item.vin} className="rounded-lg border bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-foreground">{item.vin}</div>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <div>
                        Hệ thống hiện tại:{" "}
                        <strong className={item.systemFound ? "text-emerald-700" : "text-red-700"}>
                          {item.systemFound ? item.currentLocation ?? "Có dữ liệu" : "Không tìm thấy VIN"}
                        </strong>
                      </div>
                      <div>
                        Thuộc phiếu MTOC này:{" "}
                        <strong className={item.belongsToPhieu ? "text-emerald-700" : "text-red-700"}>
                          {item.belongsToPhieu ? "Có" : "Không"}
                        </strong>
                        {item.expectedLocation && <span> · Vị trí snapshot: {item.expectedLocation}</span>}
                      </div>
                      <div>Trạng thái xe: {item.currentStatus ? statusValueLabel(item.currentStatus) : "Không có"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.systemFound && (
                      <button
                        type="button"
                        onClick={() => onLocateVin(item.vin)}
                        className="flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <LocateFixed className="h-3.5 w-3.5" />
                        Xem trên map
                      </button>
                    )}
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => kiState.removeInspectionVin(phieu.phieuNo, item.vin)}
                        className="flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Bỏ khỏi DS
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ResultButton
                    active={item.ketQua === "KHOP"}
                    tone="khop"
                    disabled={isLocked}
                    onClick={() => kiState.updateInspectionResult(phieu.phieuNo, item.vin, "KHOP", item.ghiChu)}
                  >
                    Khớp
                  </ResultButton>
                  <ResultButton
                    active={item.ketQua === "KHONG_KHOP"}
                    tone="khong-khop"
                    disabled={isLocked}
                    onClick={() =>
                      kiState.updateInspectionResult(phieu.phieuNo, item.vin, "KHONG_KHOP", item.ghiChu)
                    }
                  >
                    Không khớp
                  </ResultButton>
                </div>

                <div className="mt-2">
                  <TextAreaField
                    label="Phiếu thanh tra cho VIN này"
                    value={item.ghiChu}
                    disabled={isLocked}
                    onChange={(value) =>
                      kiState.updateInspectionResult(phieu.phieuNo, item.vin, item.ketQua, value)
                    }
                    rows={2}
                    placeholder="Ví dụ: xe đứng đúng tại A13/L4; hoặc sai số khung; hoặc xe đang ở block khác..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhuLucTab({ phieu, kiState }: { phieu: PhieuKiemKe; kiState: KIState }) {
  const isLocked = phieu.status === "DA_CHOT";
  const appendix = phieu.adjustmentAppendix ?? {
    loaiChenhLech: "THIEU" as LoaiChenhLech,
    soLuong: 0,
    lyDo: "",
    nguoiLap: "",
    ghiChu: "",
  };

  const updateAppendix = (updates: Partial<typeof appendix>) => {
    const next = { ...appendix, ...updates };
    if (!next.soLuong && !next.lyDo && !next.nguoiLap && !next.ghiChu) {
      kiState.saveAdjustmentAppendix(phieu.phieuNo, null);
      return;
    }
    kiState.saveAdjustmentAppendix(phieu.phieuNo, next);
  };

  const soLuongSauDieuChinh = phieu.adjustmentAppendix?.soLuongSauDieuChinh ?? phieu.systemQty;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold text-foreground">Ghi nhận và xử lý chênh lệch</h4>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Nếu thanh tra NG vì lệch số lượng hoặc sai số khung, bộ phận kiểm kê không sửa lùi snapshot đã
          chốt mà chỉ lập phụ lục điều chỉnh để báo cáo UBKK.
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Loại chênh lệch"
            value={appendix.loaiChenhLech}
            disabled={isLocked}
            options={[
              { value: "THIEU", label: "Thiếu so với hệ thống" },
              { value: "THUA", label: "Thừa so với hệ thống" },
            ]}
            onChange={(value) => updateAppendix({ loaiChenhLech: value as LoaiChenhLech })}
          />
          <InputField
            label="Số lượng chênh lệch"
            value={appendix.soLuong ? String(appendix.soLuong) : ""}
            disabled={isLocked}
            type="number"
            onChange={(value) =>
              updateAppendix({
                soLuong: value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0),
              })
            }
          />
          <InputField
            label="Người lập phụ lục"
            value={appendix.nguoiLap}
            disabled={isLocked}
            onChange={(value) => updateAppendix({ nguoiLap: value })}
          />
          <InputField
            label="Số lượng sau điều chỉnh"
            value={String(soLuongSauDieuChinh)}
            disabled
            onChange={() => undefined}
          />
        </div>

        <div className="mt-3">
          <TextAreaField
            label="Lý do cụ thể"
            value={appendix.lyDo}
            disabled={isLocked}
            onChange={(value) => updateAppendix({ lyDo: value })}
            placeholder='Ví dụ: "Xe số khung XYZ phòng R&D đang mượn chưa cập nhật biên nhận".'
          />
        </div>

        <div className="mt-3">
          <TextAreaField
            label="Ghi chú phụ lục"
            value={appendix.ghiChu}
            disabled={isLocked}
            onChange={(value) => updateAppendix({ ghiChu: value })}
            rows={2}
          />
        </div>

        {!isLocked && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => kiState.saveAdjustmentAppendix(phieu.phieuNo, null)}
              className="rounded-md border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Xóa phụ lục
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function statusLabel(phieu: PhieuKiemKe): string {
  if (phieu.status === "DA_CHOT") return "Đã chốt biên bản";
  if (phieu.status === "DANG_KIEM_TRA") return "Đang kiểm tra";
  return "Chờ kiểm tra";
}

function statusValueLabel(status: VehicleStatus): string {
  switch (status) {
    case "in_zone":
      return "Trong layout";
    case "in_ng":
      return "Kho Check (NG)";
    case "in_maintenance":
      return "Bảo dưỡng";
    case "in_receiving":
      return "Receiving";
    case "picked":
      return "Đã xuất";
  }
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  disabled,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foreground">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  disabled,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-foreground">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}

function ResultButton({
  active,
  tone,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  tone: "khop" | "khong-khop";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const className =
    tone === "khop"
      ? active
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-emerald-700 border-emerald-200"
      : active
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-red-700 border-red-200";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-lg border bg-background p-2 text-center shadow-sm">
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[9px] font-medium uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
