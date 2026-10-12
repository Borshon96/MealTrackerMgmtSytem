import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  INACTIVE: "bg-slate-100 text-slate-700",
  SUSPENDED: "bg-amber-100 text-amber-800",
  MEAL_TAKEN: "bg-emerald-100 text-emerald-800",
  NOT_TAKEN: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-800",
  OPEN: "bg-sky-100 text-sky-800",
  CLOSED: "bg-slate-100 text-slate-700",
  PAID: "bg-emerald-100 text-emerald-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  DUE: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  return (
    <Badge variant="secondary" className={styles[value] ?? ""}>
      {label}
    </Badge>
  );
}
