import { createFileRoute } from "@tanstack/react-router";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MONTHS, useStore, buildMonthly, sumMonthly } from "@/lib/store";
import { KpiCard, PageHeader, fmt, pct } from "@/components/PageHeader";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const store = useStore();
  const d = buildMonthly(store);

  const chartData = MONTHS.map((m) => {
    const revenue = d.influencerRevenue[m];
    const opsTotal = (["Reddit", "X", "Meta", "Video Editing"] as const).reduce(
      (s, ch) => s + d.opsByChannel[ch][m], 0
    );
    const costs = d.proxyCosts[m] + d.salaries[m] + d.bonuses[m] + opsTotal;
    return { month: m, Revenue: revenue, Costs: costs, "Net Profit": revenue - costs };
  });

  const totalRevenue = chartData.reduce((s, r) => s + r.Revenue, 0);
  const totalCosts = chartData.reduce((s, r) => s + r.Costs, 0);
  const netProfit = totalRevenue - totalCosts;
  const monthlyProxy = sumMonthly(d.proxyCosts) / 12;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Annual performance at a glance" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total Revenue" value={fmt(totalRevenue)} />
          <KpiCard label="Total Costs" value={fmt(totalCosts)} />
          <KpiCard label="Net Profit" value={fmt(netProfit)} hint={pct(netProfit / (totalRevenue || 1))} />
          <KpiCard label="Influencers" value={String(store.influencers.length)} />
          <KpiCard label="Employees" value={String(store.employees.length)} />
          <KpiCard label="Monthly Proxy Cost" value={fmt(monthlyProxy)} />
        </div>

        <div className="border border-border bg-card p-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Revenue vs Costs vs Net Profit — 12 Months</div>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#000" tick={{ fontSize: 11 }} />
                <YAxis stroke="#000" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 0 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#000" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Costs" stroke="#888" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="Net Profit" stroke="#000" strokeWidth={1} dot={{ r: 3, fill: "#000" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="px-6 py-4 border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">Monthly P&L Summary</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium text-right">Revenue</th>
                  <th className="px-4 py-3 font-medium text-right">Costs</th>
                  <th className="px-4 py-3 font-medium text-right">Gross Profit</th>
                  <th className="px-4 py-3 font-medium text-right">Net Margin %</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((r) => (
                  <tr key={r.month} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{r.month}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.Revenue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.Costs)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r["Net Profit"])}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{pct(r["Net Profit"] / (r.Revenue || 1))}</td>
                  </tr>
                ))}
                <tr className="bg-foreground text-background font-semibold">
                  <td className="px-4 py-3">FY Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(totalCosts)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(netProfit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pct(netProfit / (totalRevenue || 1))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
