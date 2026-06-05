import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MONTHS, useStore, sumMonthly, type OpsChannel, type OpsRow, emptyMonthly } from "@/lib/store";
import { PageHeader, fmt } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/operations")({ component: () => <RoleGuard allowed={["admin"]}><Page /></RoleGuard> });

const CHANNELS: OpsChannel[] = ["Reddit", "X", "Meta", "Video Editing"];
const uid = () => Math.random().toString(36).slice(2, 9);

function Page() {
  const { ops, setOps } = useStore();

  const updateCell = (ch: OpsChannel, id: string, m: typeof MONTHS[number], v: number) => {
    setOps(prev => ({ ...prev, [ch]: prev[ch].map(r => r.id === id ? { ...r, values: { ...r.values, [m]: v } } : r) }));
  };
  const updateItem = (ch: OpsChannel, id: string, item: string) => {
    setOps(prev => ({ ...prev, [ch]: prev[ch].map(r => r.id === id ? { ...r, item } : r) }));
  };
  const addRow = (ch: OpsChannel) => {
    setOps(prev => ({ ...prev, [ch]: [...prev[ch], { id: uid(), item: "New Item", values: emptyMonthly() }] }));
  };
  const removeRow = (ch: OpsChannel, id: string) => {
    setOps(prev => ({ ...prev, [ch]: prev[ch].filter(r => r.id !== id) }));
  };

  const chartData = MONTHS.map(m => {
    const row: Record<string, number | string> = { month: m };
    CHANNELS.forEach(ch => { row[ch] = ops[ch].reduce((s, r) => s + (r.values[m] || 0), 0); });
    return row;
  });
  const fills = ["#000000", "#444444", "#888888", "#cccccc"];

  return (
    <div>
      <PageHeader title="Operations" subtitle="Channel-level spend across the year" />
      <div className="p-8 space-y-8">
        {CHANNELS.map(ch => <Section key={ch} channel={ch} rows={ops[ch]}
          onCell={updateCell} onItem={updateItem} onAdd={addRow} onRemove={removeRow} />)}

        <div className="border border-border bg-card p-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Monthly Ops Spend by Channel — Stacked</div>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#000" tick={{ fontSize: 11 }} />
                <YAxis stroke="#000" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 0 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {CHANNELS.map((ch, i) => <Bar key={ch} dataKey={ch} stackId="a" fill={fills[i]} stroke="#000" strokeWidth={0.5} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ channel, rows, onCell, onItem, onAdd, onRemove }: {
  channel: OpsChannel; rows: OpsRow[];
  onCell: (ch: OpsChannel, id: string, m: typeof MONTHS[number], v: number) => void;
  onItem: (ch: OpsChannel, id: string, item: string) => void;
  onAdd: (ch: OpsChannel) => void;
  onRemove: (ch: OpsChannel, id: string) => void;
}) {
  const monthTotals = MONTHS.map(m => rows.reduce((s, r) => s + (r.values[m] || 0), 0));
  const grand = monthTotals.reduce((s, n) => s + n, 0);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Channel</div>
          <div className="text-lg font-semibold">{channel}</div>
        </div>
        <button onClick={() => onAdd(channel)} className="inline-flex items-center gap-2 border border-foreground px-3 py-1.5 text-xs hover:bg-foreground hover:text-background">
          <Plus className="h-3 w-3" /> Add Row
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1100px]">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left font-medium sticky left-0 bg-muted">Cost Item</th>
              {MONTHS.map(m => <th key={m} className="px-2 py-2 text-right font-medium">{m}</th>)}
              <th className="px-3 py-2 text-right font-medium">Annual</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-3 py-1.5 font-medium sticky left-0 bg-card"><EditableCell value={r.item} onChange={v => onItem(channel, r.id, v)} /></td>
                {MONTHS.map(m => (
                  <td key={m} className="px-1 py-1.5 text-right tabular-nums">
                    <EditableCell type="number" prefix="Rs " value={r.values[m]} onChange={v => onCell(channel, r.id, m, Number(v) || 0)} />
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{fmt(sumMonthly(r.values))}</td>
                <td className="px-2 py-1.5"><button onClick={() => onRemove(channel, r.id)} className="p-1 hover:bg-muted rounded"><Trash2 className="h-3 w-3" /></button></td>
              </tr>
            ))}
            <tr className="bg-foreground text-background font-semibold">
              <td className="px-3 py-2 sticky left-0 bg-foreground">Total</td>
              {monthTotals.map((t, i) => <td key={i} className="px-2 py-2 text-right tabular-nums">{fmt(t)}</td>)}
              <td className="px-3 py-2 text-right tabular-nums">{fmt(grand)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}