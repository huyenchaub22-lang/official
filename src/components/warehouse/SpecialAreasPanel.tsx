import { AlertTriangle, Info, Truck, Wrench } from "lucide-react";
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
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Khu vực đặc biệt (ngoài layout)</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Số đầu = xe đang ở khu vực · Số sau = sức chứa tối đa
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {areas.map((a) => {
          const Icon = ICONS[a.id];
          const tone = TONES[a.id];
          const pct = Math.round((a.count / a.capacity) * 100);
          return (
            <div key={a.id} className={`rounded-xl border p-4 ${tone.card}`}>
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
                  <div className="text-[11px] text-muted-foreground">/ {a.capacity} sức chứa</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                <div className={`h-full ${tone.icon.replace("text-", "bg-")}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-foreground/70">{a.longDesc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
