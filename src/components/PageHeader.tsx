export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border px-8 py-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Ledger / OS</div>
        <h1 className="text-2xl font-semibold mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-2 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export const fmt = (n: number) => n < 0 ? `-Rs ${Math.abs(Math.round(n)).toLocaleString("en-PK")}` : `Rs ${Math.round(n).toLocaleString("en-PK")}`;
export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;