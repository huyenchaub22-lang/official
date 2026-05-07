import { ShieldCheck, X } from "lucide-react";

interface Props {
  snapshotLabel: string;
  createdAt: string;
  onEndKI: () => void;
}

export function KIModeBanner({ snapshotLabel, createdAt, onEndKI }: Props) {
  return (
    <div className="relative overflow-hidden border-b border-orange-200 bg-orange-50 px-6 py-2.5 text-orange-950 shadow-sm">
      <div className="relative mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">
              Đợt kiểm kê đang mở - {snapshotLabel}
            </div>
            <div className="text-[10px] font-medium text-orange-800">
              Dữ liệu đã được chốt lúc {createdAt}. Mọi nhập/xuất sau thời điểm này không làm thay
              đổi phiếu kiểm kê của đợt hiện tại.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Kết thúc đợt kiểm kê hiện tại? Các phiếu đã chốt vẫn được giữ nguyên.",
              )
            ) {
              onEndKI();
            }
          }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800 transition-colors hover:bg-orange-200"
        >
          <X className="h-3.5 w-3.5" />
          Kết thúc
        </button>
      </div>
    </div>
  );
}
