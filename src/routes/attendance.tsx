import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { RoleGuard } from "@/components/RoleGuard";
import { useStore, type AttendanceStatus } from "@/lib/store";

export const Route = createFileRoute("/attendance")({
  component: () => (
    <RoleGuard allowed={["admin", "hr"]}>
      <AttendancePage />
    </RoleGuard>
  ),
});

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Cycle order when clicking a day
const STATUS_CYCLE: AttendanceStatus[] = ["present", "half-day", "leave", "absent"];

const STATUS_STYLE: Record<AttendanceStatus, { bg: string; label: string; short: string }> = {
  present:    { bg: "bg-foreground text-background",         label: "Present",  short: "✓" },
  "half-day": { bg: "bg-foreground/50 text-foreground",      label: "Half Day", short: "½" },
  leave:      { bg: "bg-foreground/20 text-foreground",      label: "Leave",    short: "L" },
  absent:     { bg: "bg-destructive/15 text-destructive",    label: "Absent",   short: "A" },
};

function AttendancePage() {
  const { employees, attendance, setAttendance } = useStore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedId, setSelectedId] = useState<string>(employees[0]?.id ?? "");
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [saved, setSaved] = useState(false);

  const employee = employees.find((e) => e.id === selectedId);
  const empRecords = attendance[selectedId] ?? {};

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Set a day's status (or clear it)
  function setDay(iso: string, status: AttendanceStatus | null) {
    setAttendance(prev => {
      const empMap = { ...(prev[selectedId] ?? {}) };
      if (status === null) delete empMap[iso];
      else empMap[iso] = status;
      return { ...prev, [selectedId]: empMap };
    });
    flashSaved();
  }

  // Click cycles through statuses, or clears if already at last
  function cycleDay(iso: string) {
    const current = empRecords[iso] as AttendanceStatus | undefined;
    if (!current) {
      setDay(iso, "present");
    } else {
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[idx + 1];
      setDay(iso, next ?? null); // null = clear
    }
  }

  // Mark all weekdays in month at once
  function markAllAs(status: AttendanceStatus) {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    setAttendance(prev => {
      const empMap = { ...(prev[selectedId] ?? {}) };
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(viewYear, viewMonth, d);
        if (date > today) continue;
        const dow = date.getDay();
        if (dow === 0 || dow === 6) continue; // skip weekends
        empMap[date.toISOString().slice(0, 10)] = status;
      }
      return { ...prev, [selectedId]: empMap };
    });
    flashSaved();
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long", year: "numeric",
  });

  type Cell = { day: number; iso: string; status: AttendanceStatus | null; isWeekend: boolean; isFuture: boolean } | null;
  const cells: Cell[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getDay();
    cells.push({
      day: d,
      iso,
      status: (empRecords[iso] as AttendanceStatus) ?? null,
      isWeekend: dow === 0 || dow === 6,
      isFuture: date > today,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  // Monthly summary
  const workdays = cells.filter((c): c is NonNullable<Cell> => !!c && !c.isWeekend && !c.isFuture);
  const counts = { present: 0, "half-day": 0, leave: 0, absent: 0 } as Record<AttendanceStatus, number>;
  workdays.forEach(c => { if (c.status) counts[c.status]++; });
  const unmarked = workdays.filter(c => !c.status).length;

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark and manage employee attendance"
      />

      <div className="px-8 py-6 space-y-6">

        {/* Employee selector + quick-mark */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
              Employee
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground min-w-[200px]"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.role || e.team}
                </option>
              ))}
            </select>
          </div>

          {/* Quick-mark all */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
              Mark all weekdays this month as
            </label>
            <div className="flex gap-2">
              {STATUS_CYCLE.map(s => (
                <button
                  key={s}
                  onClick={() => markAllAs(s)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${STATUS_STYLE[s].bg} border-transparent hover:opacity-80`}
                >
                  {STATUS_STYLE[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Saved indicator */}
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-foreground bg-muted px-3 py-1.5 rounded">
              <Check className="h-3.5 w-3.5" /> Saved
            </div>
          )}
        </div>

        {/* Calendar card */}
        <div className="border border-border bg-card p-6 max-w-3xl">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold w-44 text-center">{monthName}</span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Monthly summary chips */}
            <div className="flex gap-3 text-xs flex-wrap">
              {(Object.entries(counts) as [AttendanceStatus, number][]).map(([s, n]) => (
                <div key={s} className={`px-2 py-0.5 rounded ${STATUS_STYLE[s].bg}`}>
                  {n} {STATUS_STYLE[s].label}
                </div>
              ))}
              {unmarked > 0 && (
                <div className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {unmarked} Unmarked
                </div>
              )}
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-[10px] uppercase tracking-widest text-muted-foreground text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />;

              const isToday = cell.iso === today.toISOString().slice(0, 10);
              const clickable = !cell.isWeekend && !cell.isFuture;

              return (
                <button
                  key={cell.iso}
                  disabled={!clickable}
                  onClick={() => cycleDay(cell.iso)}
                  title={
                    cell.isWeekend ? "Weekend" :
                    cell.isFuture  ? "Future date" :
                    cell.status    ? `${cell.iso} — ${STATUS_STYLE[cell.status].label} (click to change)` :
                    `${cell.iso} — Click to mark`
                  }
                  className={`
                    relative flex flex-col items-center justify-center rounded-lg aspect-square
                    text-sm font-medium transition-all select-none group
                    ${cell.isWeekend || cell.isFuture
                      ? "opacity-25 cursor-default bg-transparent"
                      : cell.status
                        ? `${STATUS_STYLE[cell.status].bg} cursor-pointer hover:opacity-80 active:scale-95`
                        : "bg-muted/50 text-muted-foreground cursor-pointer hover:bg-muted active:scale-95"
                    }
                    ${isToday ? "ring-2 ring-foreground ring-offset-1" : ""}
                  `}
                >
                  <span className="text-xs font-semibold leading-none">{cell.day}</span>
                  {cell.status && !cell.isWeekend && (
                    <span className="text-[9px] leading-none mt-0.5 opacity-80">
                      {STATUS_STYLE[cell.status].short}
                    </span>
                  )}
                  {/* Hover hint for unmarked days */}
                  {!cell.status && !cell.isWeekend && !cell.isFuture && (
                    <span className="text-[8px] leading-none mt-0.5 opacity-0 group-hover:opacity-50 transition-opacity">
                      +
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend + instructions */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {STATUS_CYCLE.map(s => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${STATUS_STYLE[s].bg}`}>
                    {STATUS_STYLE[s].short}
                  </div>
                  {STATUS_STYLE[s].label}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Click a day to cycle: Present → Half Day → Leave → Absent → Clear
            </p>
          </div>
        </div>

        {/* Employee info strip */}
        {employee && (
          <div className="flex gap-6 text-xs text-muted-foreground border border-border bg-card px-5 py-3 rounded max-w-3xl">
            <span><span className="font-medium text-foreground">{employee.name}</span></span>
            <span>Role: <span className="text-foreground">{employee.role || "—"}</span></span>
            <span>Team: <span className="text-foreground">{employee.team}</span></span>
            <span>System Role: <span className="text-foreground capitalize">{employee.systemRole || "—"}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
