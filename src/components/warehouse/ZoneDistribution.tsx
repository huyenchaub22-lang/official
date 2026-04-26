import { COLORS } from "@/lib/warehouse/mockData";
import type { Vehicle, Zone } from "@/lib/warehouse/types";

interface Props {
  zones: Zone[];
  vehicles: Vehicle[];
}

export function ZoneDistribution({ zones, vehicles }: Props) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-foreground">Phân bố model & màu theo zone</h3>
        <p className="text-xs text-muted-foreground">
          1 zone tối đa 1–2 model để dễ quản lý · các làn cùng MTOC
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {zones.map((z) => {
          const vs = vehicles.filter((v) => v.zoneId === z.id);
          const colorSet = new Set<string>();
          vs.forEach((v) => colorSet.add(v.colorCode));
          const colorList = Array.from(colorSet)
            .map((code) => COLORS.find((c) => c.code === code))
            .filter((c): c is (typeof COLORS)[number] => Boolean(c));
          return (
            <div key={z.id} className="rounded-lg border bg-background p-3">
              <div className="font-semibold text-foreground">{z.label}</div>
              <div className="text-xs text-muted-foreground">{z.modelNames.join(", ")}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {colorList.map((c) => (
                  <span
                    key={c.code}
                    title={`${c.name} (${c.code})`}
                    className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
