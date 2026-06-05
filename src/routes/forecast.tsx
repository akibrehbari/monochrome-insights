import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { MONTHS, useStore, buildMonthly, sumMonthly, type Month } from "@/lib/store";
import { KpiCard, PageHeader, fmt, pct } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/forecast")({ component: () => <RoleGuard allowed={["admin"]}><Page /></RoleGuard> });

function Page() {
  const store = useStore();
  const d = buildMonthly(store);
  const { extras, setExtras } = store;

  const rows = MONTHS.map(m => {
    const influencerRev = d.influencerRevenue[m];
    const otherRev = extras.otherRevenue[m];
    const totalRev = influencerRev + otherRev;
    const proxy = d.proxyCosts[m];
    const salaries = d.salaries[m];
    const bonuses = d.bonuses[m];
    const reddit = d.opsByChannel.Reddit[m];
    const x = d.opsByChannel.X[m];
    const meta = d.opsByChannel.Meta[m];
    const video = d.opsByChannel["Video Editing"][m];
    const misc = extras.miscellaneous[m];
    const cogs = proxy;
    const opCosts = salaries + bonuses + reddit + x + meta + video + misc;
    const grossProfit = totalRev - cogs;
    const grossMargin = totalRev ? grossProfit / totalRev : 0;
    const ebitda = grossProfit - opCosts;
    const totalCosts = cogs + opCosts;
    const netProfit = totalRev - totalCosts;
    const netMargin = totalRev ? netProfit / totalRev : 0;
    return { m, influencerRev, otherRev, totalRev, proxy, salaries, bonuses, reddit, x, meta, video, misc, cogs, opCosts, grossProfit, grossMargin, ebitda, totalCosts, netProfit, netMargin };
  });

  const fyRevenue = rows.reduce((s, r) => s + r.totalRev, 0);
  const fyNet = rows.reduce((s, r) => s + r.netProfit, 0);
  const fyMargin = fyRevenue ? fyNet / fyRevenue : 0;

  type LineKey = keyof typeof rows[number];
  const sumLine = (k: LineKey) => rows.reduce((s, r) => s + (r[k] as number), 0);

  const editExtra = (which: "otherRevenue" | "miscellaneous", m: Month, v: number) =>
    setExtras(prev => ({ ...prev, [which]: { ...prev[which], [m]: v } }));

  const Row = ({ label, k, bold = false, indent = false, pctRow = false }: { label: string; k: LineKey; bold?: boolean; indent?: boolean; pctRow?: boolean }) => (
    <tr className={`border-b border-border ${bold ? "bg-muted font-semibold" : ""}`}>
      <td className={`px-3 py-1.5 sticky left-0 ${bold ? "bg-muted" : "bg-card"} ${indent ? "pl-8" : ""}`}>{label}</td>
      {MONTHS.map(m => {
        const r = rows.find(x => x.m === m)!;
        const v = r[k] as number;
        return <td key={m} className="px-2 py-1.5 text-right tabular-nums">{pctRow ? pct(v) : fmt(v)}</td>;
      })}
      <td className="px-3 py-1.5 text-right tabular-nums">
        {pctRow ? pct(sumLine(k) / 12) : fmt(sumLine(k))}
      </td>
    </tr>
  );

  return (
    <div>
      <PageHeader title="Forecast" subtitle="Full-year P&L — edit any cell" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="FY Revenue" value={fmt(fyRevenue)} />
          <KpiCard label="FY Net Profit" value={fmt(fyNet)} />
          <KpiCard label="Net Margin %" value={pct(fyMargin)} />
        </div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-[1400px]">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="px-3 py-2 text-left sticky left-0 bg-foreground">Line Item</th>
                {MONTHS.map(m => <th key={m} className="px-2 py-2 text-right">{m}</th>)}
                <th className="px-3 py-2 text-right">FY</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-muted/60"><td className="px-3 py-1.5 sticky left-0 bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground" colSpan={14}>Revenue</td></tr>
              <Row label="Influencer Revenue" k="influencerRev" indent />
              <tr className="border-b border-border">
                <td className="px-3 py-1.5 sticky left-0 bg-card pl-8">Other Revenue</td>
                {MONTHS.map(m => (
                  <td key={m} className="px-1 py-1.5 text-right tabular-nums">
                    <EditableCell type="number" prefix="Rs " value={extras.otherRevenue[m]} onChange={v => editExtra("otherRevenue", m, Number(v) || 0)} />
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt(sumMonthly(extras.otherRevenue))}</td>
              </tr>
              <Row label="Total Revenue" k="totalRev" bold />

              <tr className="bg-muted/60"><td className="px-3 py-1.5 sticky left-0 bg-muted/60 text-[10px] uppercase tracking-widest text-muted-foreground" colSpan={14}>Costs</td></tr>
              <Row label="Proxy Costs (COGS)" k="proxy" indent />
              <Row label="Salaries" k="salaries" indent />
              <Row label="Bonuses" k="bonuses" indent />
              <Row label="Reddit Ops" k="reddit" indent />
              <Row label="X Ops" k="x" indent />
              <Row label="Meta Ops" k="meta" indent />
              <Row label="Video Editing" k="video" indent />
              <tr className="border-b border-border">
                <td className="px-3 py-1.5 sticky left-0 bg-card pl-8">Miscellaneous</td>
                {MONTHS.map(m => (
                  <td key={m} className="px-1 py-1.5 text-right tabular-nums">
                    <EditableCell type="number" prefix="Rs " value={extras.miscellaneous[m]} onChange={v => editExtra("miscellaneous", m, Number(v) || 0)} />
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right tabular-nums">{fmt(sumMonthly(extras.miscellaneous))}</td>
              </tr>

              <Row label="COGS" k="cogs" bold />
              <Row label="Operating Costs" k="opCosts" bold />
              <Row label="Gross Profit" k="grossProfit" bold />
              <Row label="Gross Margin %" k="grossMargin" bold pctRow />
              <Row label="EBITDA" k="ebitda" bold />
              <Row label="Total Costs" k="totalCosts" bold />

              <tr className="bg-foreground text-background font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-foreground">Net Profit / Loss</td>
                {rows.map(r => <td key={r.m} className="px-2 py-2 text-right tabular-nums">{fmt(r.netProfit)}</td>)}
                <td className="px-3 py-2 text-right tabular-nums">{fmt(fyNet)}</td>
              </tr>
              <tr className="bg-foreground text-background font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-foreground">Net Margin %</td>
                {rows.map(r => <td key={r.m} className="px-2 py-2 text-right tabular-nums">{pct(r.netMargin)}</td>)}
                <td className="px-3 py-2 text-right tabular-nums">{pct(fyMargin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}