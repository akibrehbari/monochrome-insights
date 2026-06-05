import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { Plus, Trash2, X, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStore, type Employee, type Team, type SystemRole } from "@/lib/store";
import { PageHeader, fmt } from "@/components/PageHeader";
import { EditableCell } from "@/components/EditableCell";

export const Route = createFileRoute("/employees")({ component: () => <RoleGuard allowed={["admin","hr"]}><Page /></RoleGuard> });

const TEAMS: Team[] = ["Reddit", "X", "Meta", "Video Editing", "Management"];
const SYSTEM_ROLES: { value: SystemRole; label: string }[] = [
  { value: "",         label: "— Unassigned" },
  { value: "admin",    label: "Admin" },
  { value: "hr",       label: "HR" },
  { value: "employee", label: "Employee" },
];
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Add Employee Modal ───────────────────────────────────────────────────────

type NewEmployeeForm = {
  name: string;
  role: string;
  systemRole: SystemRole;
  team: Team;
  monthlySalary: string;
  monthlyBonus: string;
  notes: string;
  username: string;
  password: string;
};

const emptyForm = (): NewEmployeeForm => ({
  name: "",
  role: "",
  systemRole: "employee",
  team: "Reddit",
  monthlySalary: "",
  monthlyBonus: "",
  notes: "",
  username: "",
  password: "",
});

function AddEmployeeModal({ onAdd, onClose }: { onAdd: (e: Employee) => void; onClose: () => void }) {
  const [form, setForm] = useState<NewEmployeeForm>(emptyForm());
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewEmployeeForm, string>>>({});

  const set = <K extends keyof NewEmployeeForm>(k: K, v: NewEmployeeForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim())     e.name = "Required";
    if (!form.role.trim())     e.role = "Required";
    if (!form.systemRole)      e.systemRole = "Select a role";
    if (!form.username.trim()) e.username = "Required";
    if (!form.password.trim()) e.password = "Required";
    if (form.password && form.password.length < 6) e.password = "Min 6 characters";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onAdd({
      id: uid(),
      name: form.name.trim(),
      role: form.role.trim(),
      systemRole: form.systemRole,
      team: form.team,
      monthlySalary: Number(form.monthlySalary) || 0,
      monthlyBonus: Number(form.monthlyBonus) || 0,
      notes: form.notes.trim(),
      username: form.username.trim(),
      password: form.password,
    });
  }

  const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  const inputCls = "w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground";
  const errCls = "border-destructive";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">Add New Employee</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in details and set login credentials</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Section: Personal Info */}
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
            Personal Info
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.name}>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Sara Lin"
                className={`${inputCls} ${errors.name ? errCls : ""}`}
              />
            </Field>
            <Field label="Job Title" error={errors.role}>
              <input
                value={form.role}
                onChange={e => set("role", e.target.value)}
                placeholder="e.g. Reddit Lead"
                className={`${inputCls} ${errors.role ? errCls : ""}`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Team">
              <select
                value={form.team}
                onChange={e => set("team", e.target.value as Team)}
                className={inputCls}
              >
                {TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <input
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Optional note"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Section: Compensation */}
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1 pt-1">
            Compensation (PKR)
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Salary">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input
                  type="number"
                  min="0"
                  value={form.monthlySalary}
                  onChange={e => set("monthlySalary", e.target.value)}
                  placeholder="0"
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>
            <Field label="Monthly Bonus">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rs</span>
                <input
                  type="number"
                  min="0"
                  value={form.monthlyBonus}
                  onChange={e => set("monthlyBonus", e.target.value)}
                  placeholder="0"
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>
          </div>

          {/* Section: Login Credentials */}
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border pb-1 pt-1">
            Login Credentials
          </div>

          <Field label="System Role" error={errors.systemRole}>
            <div className="grid grid-cols-3 gap-2">
              {SYSTEM_ROLES.filter(r => r.value !== "").map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("systemRole", o.value)}
                  className={`py-2 text-sm rounded border transition-colors ${
                    form.systemRole === o.value
                      ? "bg-foreground text-background border-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Username / Email" error={errors.username}>
            <input
              type="text"
              value={form.username}
              onChange={e => set("username", e.target.value)}
              placeholder="e.g. sara@eleopards.com"
              className={`${inputCls} ${errors.username ? errCls : ""}`}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder="Min. 6 characters"
                className={`${inputCls} pr-10 ${errors.password ? errCls : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* Summary preview */}
          {form.name && form.username && form.systemRole && (
            <div className="bg-muted/50 border border-border rounded p-3 text-xs text-muted-foreground space-y-0.5">
              <div><span className="font-medium text-foreground">{form.name}</span> will be added as <span className="font-medium text-foreground capitalize">{form.systemRole}</span></div>
              <div>Login: <span className="font-medium text-foreground">{form.username}</span></div>
              {(Number(form.monthlySalary) > 0 || Number(form.monthlyBonus) > 0) && (
                <div>Monthly pay: <span className="font-medium text-foreground">{fmt((Number(form.monthlySalary) || 0) + (Number(form.monthlyBonus) || 0))}</span></div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-foreground text-background rounded hover:opacity-90 transition-opacity font-medium"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function Page() {
  const { employees, setEmployees } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showPwFor, setShowPwFor] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Employee>) =>
    setEmployees(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => {
    if (confirm("Remove this employee?")) setEmployees(prev => prev.filter(r => r.id !== id));
  };

  const teamData = TEAMS.map(t => {
    const list = employees.filter(e => e.team === t);
    const cost = list.reduce((s, e) => s + e.monthlySalary + e.monthlyBonus, 0);
    return { team: t, Cost: cost, Headcount: list.length };
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} on payroll`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-foreground text-background px-3 py-2 text-sm hover:opacity-90 rounded"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        }
      />

      <div className="p-8 space-y-6">
        <div className="border border-border overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[1500px]">
            <thead className="bg-muted border-b border-border">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["#","Name","Job Title","System Role","Team","Username","Password","M. Salary","A. Salary","M. Bonus","A. Bonus","Total M.","Total A.","Notes",""].map(h =>
                  <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {employees.map((r, i) => {
                const totalM = r.monthlySalary + r.monthlyBonus;
                const pwVisible = showPwFor === r.id;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      <EditableCell value={r.name} onChange={v => update(r.id, { name: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <EditableCell value={r.role} onChange={v => update(r.id, { role: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.systemRole ?? ""}
                        onChange={e => update(r.id, { systemRole: e.target.value as SystemRole })}
                        className="text-sm border border-border bg-background px-2 py-1 rounded"
                      >
                        {SYSTEM_ROLES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.team}
                        onChange={e => update(r.id, { team: e.target.value as Team })}
                        className="text-sm border border-border bg-background px-2 py-1"
                      >
                        {TEAMS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    {/* Username */}
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.username
                        ? <EditableCell value={r.username} onChange={v => update(r.id, { username: v })} />
                        : <span className="italic">—</span>}
                    </td>
                    {/* Password */}
                    <td className="px-3 py-2">
                      {r.password ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono">
                            {pwVisible ? r.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => setShowPwFor(pwVisible ? null : r.id)}
                            className="text-muted-foreground hover:text-foreground ml-1"
                          >
                            {pwVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <EditableCell type="number" prefix="Rs " value={r.monthlySalary} onChange={v => update(r.id, { monthlySalary: Number(v) || 0 })} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.monthlySalary * 12)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <EditableCell type="number" prefix="Rs " value={r.monthlyBonus} onChange={v => update(r.id, { monthlyBonus: Number(v) || 0 })} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.monthlyBonus * 12)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(totalM)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(totalM * 12)}</td>
                    <td className="px-3 py-2 max-w-[140px]">
                      <EditableCell value={r.notes} onChange={v => update(r.id, { notes: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => remove(r.id)} className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                  <YAxis stroke="#000" tick={{ fontSize: 11 }} tickFormatter={v => `Rs ${(v/1000).toFixed(0)}k`} />
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

      {showModal && (
        <AddEmployeeModal
          onAdd={(emp) => { setEmployees(prev => [...prev, emp]); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
