import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { useStore, type Influencer } from "@/lib/store";
import { PageHeader, fmt } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/influencers")({ component: Page });

const uid = () => Math.random().toString(36).slice(2, 9);

function Page() {
  const { influencers, setInfluencers } = useStore();
  const [niche, setNiche] = useState<string>("All");
  const [q, setQ] = useState("");

  const niches = useMemo(() => ["All", ...Array.from(new Set(influencers.map(i => i.niche)))], [influencers]);
  const rows = influencers.filter(i =>
    (niche === "All" || i.niche === niche) &&
    (q === "" || i.name.toLowerCase().includes(q.toLowerCase()) || i.screenName.toLowerCase().includes(q.toLowerCase()))
  );

  const update = (id: string, patch: Partial<Influencer>) =>
    setInfluencers(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setInfluencers(prev => prev.filter(r => r.id !== id));
  const add = () => setInfluencers(prev => [...prev, {
    id: uid(), name: "New Influencer", screenName: "", redditAccount: "", email: "",
    proxyId: "", niche: "General", driveLink: "", monthlyRevenue: 0, monthlyCost: 0, notes: ""
  }]);

  return (
    <div>
      <PageHeader title="Influencers" subtitle={`${influencers.length} active creators`} actions={
        <button onClick={add} className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-2 text-sm hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Influencer
        </button>
      } />
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or screen name…"
              className="w-full border border-border pl-9 pr-3 py-2 text-sm bg-background outline-none focus:border-foreground" />
          </div>
          <select value={niche} onChange={e => setNiche(e.target.value)}
            className="border border-border px-3 py-2 text-sm bg-background outline-none focus:border-foreground">
            {niches.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div className="border border-border overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-muted border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["#","Name","Screen Name","Reddit","Email","Proxy ID","Niche","Drive","Revenue","Cost","Net","Notes",""].map(h =>
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const net = r.monthlyRevenue - r.monthlyCost;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium"><EditableCell value={r.name} onChange={v => update(r.id, { name: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.screenName} onChange={v => update(r.id, { screenName: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.redditAccount} onChange={v => update(r.id, { redditAccount: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.email} onChange={v => update(r.id, { email: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.proxyId} onChange={v => update(r.id, { proxyId: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.niche} onChange={v => update(r.id, { niche: v })} /></td>
                    <td className="px-3 py-2 max-w-[160px] truncate"><EditableCell value={r.driveLink} onChange={v => update(r.id, { driveLink: v })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums"><EditableCell type="number" prefix="Rs " value={r.monthlyRevenue} onChange={v => update(r.id, { monthlyRevenue: Number(v) || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums"><EditableCell type="number" prefix="Rs " value={r.monthlyCost} onChange={v => update(r.id, { monthlyCost: Number(v) || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(net)}</td>
                    <td className="px-3 py-2 max-w-[160px]"><EditableCell value={r.notes} onChange={v => update(r.id, { notes: v })} /></td>
                    <td className="px-3 py-2">
                      <button onClick={() => remove(r.id)} className="p-1.5 hover:bg-muted rounded" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}