interface Props {
  message?: string;
}

export function SpotCheckSection({
  message = "Spot-check da duoc thay bang danh sach xe tu snapshot he thong.",
}: Props) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">{message}</div>
  );
}
