import { ArrowRight, X } from "lucide-react";
import type { Vehicle } from "@/lib/warehouse/types";

interface Props {
  vehicle: Vehicle | null;
  onClose: () => void;
}

const NODE_LABEL: Record<string, string> = {
  "—": "Nhà máy",
  RECV: "Receiving",
  NG: "NG Zone",
  MAINT: "Bảo dưỡng",
};

export function VehicleHistoryDrawer({ vehicle, onClose }: Props) {
  if (!vehicle) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <header className="flex items-start justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-foreground">Lịch sử di chuyển</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b p-4">
          <div className="rounded-lg border bg-background p-3">
            <div className="text-base font-semibold text-foreground">{vehicle.modelName}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              VIN: <span className="font-mono text-foreground">{vehicle.vin}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {vehicle.modelCode} {vehicle.typeCode} ·{" "}
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border"
                  style={{ backgroundColor: vehicle.colorHex }}
                />
                {vehicle.colorName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <ol className="relative space-y-4 border-l-2 border-muted pl-6">
            {vehicle.history.map((h, idx) => (
              <li key={idx} className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                <div className="text-xs text-muted-foreground">{h.ts}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm font-mono">
                  <span className="text-muted-foreground">{NODE_LABEL[h.from] ?? h.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-bold text-foreground">{NODE_LABEL[h.to] ?? h.to}</span>
                </div>
                <div className="mt-1 text-xs text-foreground">{h.note}</div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
