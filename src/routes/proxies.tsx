import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useState } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useStore, type Proxy } from "@/lib/store";
import { KpiCard, PageHeader, fmt } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/proxies")({ component: () => <RoleGuard allowed={["admin"]}><Page /></RoleGuard> });

const newId = () => `PRX-${Math.floor(Math.random() * 900 + 100)}`;

function Page() {
  const { proxies, setProxies } = useStore();
  const [status, setStatus] = useState<"All" | "Active" | "Expired">("All");

  const rows = proxies.filter(p => status === "All" || p.status === status);
  const monthly = proxies.filter(p => p.status === "Active").reduce((s, p) => s + p.monthlyCost, 0);
  const annual = monthly * 12;
  const activeCount = proxies.filter(p => p.status === "Active").length;

  const update = (id: string, patch: Partial<Proxy>) =>
    setProxies(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setProxies(prev => prev.filter(r => r.id !== id));
  const add = () => setProxies(prev => [...prev, {
    id: newId(), provider: "", currentIp: "", changeUrl: "", monthlyCost: 0,
    renewalDate: new Date().toISOString().slice(0,10), status: "Active",
    assignedInfluencer: "", notes: "",
  }]);

  return (
    <div>
      <PageHeader title="Proxies" subtitle="Infrastructure and renewals" actions={
        <button onClick={add} className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-2 text-sm hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Proxy
        </button>
      } />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Total Monthly Proxy Cost" value={fmt(monthly)} />
          <KpiCard label="Total Annual Proxy Cost" value={fmt(annual)} />
          <KpiCard label="Active Proxies" value={String(activeCount)} />
        </div>

        <div className="flex items-center gap-3">
          <select value={status} onChange={e => setStatus(e.target.value as never)}
            className="border border-border px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
            <option>All</option><option>Active</option><option>Expired</option>
          </select>
        </div>

        <div className="border border-border overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-muted border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["Proxy ID","Provider","Current IP/URL","Change URL","Monthly $","Renewal","Status","Assigned","Notes","Annual $",""].map(h =>
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono">{r.id}</td>
                  <td className="px-3 py-2"><EditableCell value={r.provider} onChange={v => update(r.id, { provider: v })} /></td>
                  <td className="px-3 py-2"><EditableCell value={r.currentIp} onChange={v => update(r.id, { currentIp: v })} /></td>
                  <td className="px-3 py-2 max-w-[160px] truncate">
                    {r.changeUrl
                      ? <a href={r.changeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2"><ExternalLink className="h-3 w-3" />Open</a>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums"><EditableCell type="number" prefix="Rs " value={r.monthlyCost} onChange={v => update(r.id, { monthlyCost: Number(v) || 0 })} /></td>
                  <td className="px-3 py-2"><EditableCell value={r.renewalDate} onChange={v => update(r.id, { renewalDate: v })} /></td>
                  <td className="px-3 py-2">
                    <select value={r.status} onChange={e => update(r.id, { status: e.target.value as Proxy["status"] })}
                      className={`text-xs uppercase tracking-wider border px-2 py-1 ${r.status === "Active" ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground"}`}>
                      <option>Active</option><option>Expired</option>
                    </select>
                  </td>
                  <td className="px-3 py-2"><EditableCell value={r.assignedInfluencer} onChange={v => update(r.id, { assignedInfluencer: v })} /></td>
                  <td className="px-3 py-2 max-w-[140px]"><EditableCell value={r.notes} onChange={v => update(r.id, { notes: v })} /></td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(r.monthlyCost * 12)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => remove(r.id)} className="p-1.5 hover:bg-muted rounded" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}