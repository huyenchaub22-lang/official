import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Send, Truck, Wrench } from "lucide-react";
import type { SpecialArea } from "@/lib/warehouse/types";

const ICONS = {
  NG: AlertTriangle,
  MAINT: Wrench,
  RECV: Truck,
} as const;

const TONES: Record<SpecialArea["id"], { card: string; icon: string; pct: string }> = {
  NG: {
    card: "border-red-200 bg-red-50",
    icon: "text-red-600",
    pct: "text-red-700",
  },
  MAINT: {
    card: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    pct: "text-amber-700",
  },
  RECV: {
    card: "border-sky-200 bg-sky-50",
    icon: "text-sky-600",
    pct: "text-sky-700",
  },
};

interface Props {
  areas: SpecialArea[];
}

export function SpecialAreasPanel({ areas }: Props) {
  const [vinInput, setVinInput] = useState("");
  const [requestMsg, setRequestMsg] = useState<string | null>(null);

  function handleRequest() {
    const vin = vinInput.trim().toUpperCase();
    if (!vin) {
      setRequestMsg("⚠ Vui lòng nhập số VIN của xe NG cần sửa chữa");
      setTimeout(() => setRequestMsg(null), 3000);
      return;
    }
    setRequestMsg(`✓ Đã gửi yêu cầu nhà máy sửa chữa cho VIN ${vin}`);
    setVinInput("");
    setTimeout(() => setRequestMsg(null), 4000);
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Khu vực đặc biệt (ngoài layout)</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Số xe đang nằm tại khu vực
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {areas.map((a) => {
          const Icon = ICONS[a.id];
          const tone = TONES[a.id];
          return (
            <div key={a.id} className={`flex flex-col rounded-xl border p-4 ${tone.card}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Icon className={`mt-0.5 h-5 w-5 ${tone.icon}`} />
                  <div>
                    <div className="font-semibold text-foreground">{a.label}</div>
                    <div className="text-xs text-foreground/80">{a.shortDesc}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${tone.pct}`}>{a.count}</div>
                  <div className="text-[11px] text-muted-foreground">xe</div>
                </div>
              </div>
              <p className="mt-3 flex-1 text-[11px] leading-snug text-foreground/70">{a.longDesc}</p>

              {a.id === "MAINT" && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value)}
                      placeholder="Nhập VIN xe NG cần sửa..."
                      className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-2 py-1.5 font-mono text-xs outline-none ring-amber-400/40 focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={handleRequest}
                      className="flex items-center gap-1 whitespace-nowrap rounded-md bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Y/c sửa chữa
                    </button>
                  </div>
                  {requestMsg && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-900">
                      {requestMsg.startsWith("✓") && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      {requestMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
