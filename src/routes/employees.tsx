import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStore, type Employee, type Team } from "@/lib/store";
import { PageHeader, fmt } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/employees")({ component: () => <RoleGuard allowed={["admin","hr"]}><Page /></RoleGuard> });

const TEAMS: Team[] = ["Reddit", "X", "Meta", "Video Editing", "Management"];
const uid = () => Math.random().toString(36).slice(2, 9);

function Page() {
  const { employees, setEmployees } = useStore();
  const update = (id: string, patch: Partial<Employee>) =>
    setEmployees(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setEmployees(prev => prev.filter(r => r.id !== id));
  const add = () => setEmployees(prev => [...prev, { id: uid(), name: "New Hire", role: "", team: "Reddit", monthlySalary: 0, monthlyBonus: 0, notes: "" }]);

  const teamData = TEAMS.map(t => {
    const list = employees.filter(e => e.team === t);
    const cost = list.reduce((s, e) => s + e.monthlySalary + e.monthlyBonus, 0);
    return { team: t, Cost: cost, Headcount: list.length };
  });

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${employees.length} on payroll`} actions={
        <button onClick={add} className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-2 text-sm hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      } />
      <div className="p-8 space-y-6">
        <div className="border border-border overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[1200px]">
            <thead className="bg-muted border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["#","Name","Role","Team","M. Salary","A. Salary","M. Bonus","A. Bonus","Total M.","Total A.","Notes",""].map(h =>
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.map((r, i) => {
                const totalM = r.monthlySalary + r.monthlyBonus;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium"><EditableCell value={r.name} onChange={v => update(r.id, { name: v })} /></td>
                    <td className="px-3 py-2"><EditableCell value={r.role} onChange={v => update(r.id, { role: v })} /></td>
                    <td className="px-3 py-2">
                      <select value={r.team} onChange={e => update(r.id, { team: e.target.value as Team })}
                        className="text-sm border border-border bg-background px-2 py-1">
                        {TEAMS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums"><EditableCell type="number" prefix="Rs " value={r.monthlySalary} onChange={v => update(r.id, { monthlySalary: Number(v) || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.monthlySalary * 12)}</td>
                    <td className="px-3 py-2 text-right tabular-nums"><EditableCell type="number" prefix="Rs " value={r.monthlyBonus} onChange={v => update(r.id, { monthlyBonus: Number(v) || 0 })} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.monthlyBonus * 12)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(totalM)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(totalM * 12)}</td>
                    <td className="px-3 py-2 max-w-[140px]"><EditableCell value={r.notes} onChange={v => update(r.id, { notes: v })} /></td>
                    <td className="px-3 py-2">
                      <button onClick={() => remove(r.id)} className="p-1.5 hover:bg-muted rounded"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="border border-border bg-card p-6 lg:col-span-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Monthly Cost per Team</div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={teamData}>
                  <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
                  <XAxis dataKey="team" stroke="#000" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#000" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #000", borderRadius: 0 }} />
                  <Bar dataKey="Cost" fill="#000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border border-border bg-card p-6">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Headcount</div>
            <ul className="space-y-2">
              {teamData.map(t => (
                <li key={t.team} className="flex justify-between border-b border-border pb-2 text-sm">
                  <span>{t.team}</span>
                  <span className="font-semibold tabular-nums">{t.Headcount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}