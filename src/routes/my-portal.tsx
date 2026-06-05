import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeader, fmt } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { AttendanceChart } from "@/components/AttendanceChart";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/my-portal")({
  component: MyPortalPage,
});

function MyPortalPage() {
  return (
    <RoleGuard allowed={["employee"]}>
      <MyPortalContent />
    </RoleGuard>
  );
}

function MyPortalContent() {
  const { user } = useAuth();
  const { employees, sops, attendance } = useStore();
  const [expandedSop, setExpandedSop] = useState<string | null>(null);

  const employee = employees.find((e) => e.id === user?.employeeId);
  const myAttendance = user?.employeeId ? attendance[user.employeeId] ?? {} : {};
  const mySOPs = sops.filter((s) => s.assignedRoles.includes("employee"));

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-sm">
        Employee record not found. Contact HR.
      </div>
    );
  }

  const totalMonthly = employee.monthlySalary + employee.monthlyBonus;
  const totalAnnual = totalMonthly * 12;

  // Attendance quick stats for current month
  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7); // "2026-06"
  const thisMonthRecords = Object.entries(myAttendance).filter(([d]) => d.startsWith(monthPrefix));
  const presentThisMonth = thisMonthRecords.filter(([, s]) => s === "present" || s === "half-day").length;
  const workingDaysThisMonth = thisMonthRecords.length;

  return (
    <div>
      <PageHeader
        title="My Portal"
        subtitle={`${employee.name} · ${employee.role} · ${employee.team}`}
      />

      <div className="px-8 py-6 space-y-8">

        {/* Salary card */}
        <section>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Compensation
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Monthly Salary", value: fmt(employee.monthlySalary) },
              { label: "Monthly Bonus", value: fmt(employee.monthlyBonus) },
              { label: "Total Monthly", value: fmt(totalMonthly) },
              { label: "Total Annual", value: fmt(totalAnnual) },
            ].map((k) => (
              <div key={k.label} className="border border-border bg-card p-5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-semibold mt-2 tabular-nums">{k.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Salaries are paid on the 1st of each month. For queries contact hr@eleopards.com.
          </p>
        </section>

        {/* Attendance */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Attendance
            </div>
            <div className="text-xs text-muted-foreground">
              This month: <span className="font-medium text-foreground">{presentThisMonth}</span>
              {workingDaysThisMonth > 0 && <span> / {workingDaysThisMonth} days</span>}
            </div>
          </div>
          <div className="border border-border bg-card p-6">
            <AttendanceChart records={myAttendance} />
          </div>
        </section>

        {/* SOPs */}
        <section>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Standard Operating Procedures ({mySOPs.length})
          </div>
          {mySOPs.length === 0 && (
            <div className="text-sm text-muted-foreground">No SOPs assigned to your role yet.</div>
          )}
          <div className="space-y-2">
            {mySOPs.map((sop) => (
              <div key={sop.id} className="border border-border rounded">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedSop(expandedSop === sop.id ? null : sop.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedSop === sop.id
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <div>
                      <div className="text-sm font-medium">{sop.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sop.category} · {sop.createdAt}
                      </div>
                    </div>
                  </div>
                </div>
                {expandedSop === sop.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border">
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground/90">
                      {sop.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
