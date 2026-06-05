import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type AttendanceRecord, type AttendanceStatus } from "@/lib/store";

interface Props {
  records: AttendanceRecord;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_BG: Record<AttendanceStatus | "none" | "future" | "weekend", string> = {
  present:    "bg-foreground text-background",
  "half-day": "bg-foreground/50 text-foreground",
  leave:      "bg-foreground/20 text-foreground",
  absent:     "bg-destructive/15 text-destructive",
  none:       "bg-muted/60 text-muted-foreground",
  future:     "bg-transparent text-muted-foreground/30",
  weekend:    "bg-transparent text-muted-foreground/25",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present:    "Present",
  "half-day": "Half Day",
  leave:      "Leave",
  absent:     "Absent",
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present:    "bg-foreground",
  "half-day": "bg-foreground/50",
  leave:      "bg-foreground/20",
  absent:     "bg-destructive/40",
};

export function AttendanceChart({ records }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const futureLimit = new Date(today.getFullYear(), today.getMonth(), 1);
    const current = new Date(viewYear, viewMonth, 1);
    if (current >= futureLimit) return; // don't go past current month
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", { month: "long", year: "numeric" });

  // Build calendar grid (Mon = 0 ... Sun = 6)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon-based offset
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6

  type Cell = { day: number; date: Date; iso: string; status: AttendanceStatus | "none" | "future" | "weekend" } | null;
  const cells: Cell[] = [];

  // Leading empty cells
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    let status: Cell["status"];

    if (date > today) {
      status = "future";
    } else if (isWeekend) {
      status = "weekend";
    } else if (records[iso]) {
      status = records[iso];
    } else {
      status = "none";
    }
    cells.push({ day: d, date, iso, status });
  }

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Monthly stats (weekdays only, not future)
  const monthISOs = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewYear, viewMonth, i + 1);
    return { iso: d.toISOString().slice(0, 10), dow: d.getDay(), date: d };
  }).filter(({ dow, date }) => dow !== 0 && dow !== 6 && date <= today);

  const counts: Record<AttendanceStatus, number> = { present: 0, "half-day": 0, leave: 0, absent: 0 };
  monthISOs.forEach(({ iso }) => {
    const s = records[iso] as AttendanceStatus | undefined;
    if (s) counts[s]++;
    else counts.absent++; // unmarked weekday in the past = absent
  });
  const totalDays = monthISOs.length;
  const pct = totalDays ? Math.round(((counts.present + counts["half-day"] * 0.5) / totalDays) * 100) : 0;

  return (
    <div className="w-full">
      {/* Header: nav + stats */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold w-40 text-center">{monthName}</span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-semibold tabular-nums">{pct}%</span>
            <span className="text-muted-foreground uppercase tracking-widest text-[10px]">rate</span>
          </div>
          {(Object.entries(counts) as [AttendanceStatus, number][]).map(([s, n]) => (
            <div key={s} className="flex items-center gap-1 text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              <span className="font-medium text-foreground">{n}</span>
              <span>{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[10px] uppercase tracking-widest text-muted-foreground text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} />;
          }

          const isToday = cell.iso === today.toISOString().slice(0, 10);
          const isWeekend = cell.status === "weekend";
          const isFuture = cell.status === "future";
          const hasStatus = !isWeekend && !isFuture && cell.status !== "none";
          const label = hasStatus ? STATUS_LABEL[cell.status as AttendanceStatus] : undefined;

          return (
            <div
              key={cell.iso}
              title={label ? `${cell.iso} — ${label}` : cell.iso}
              className={`
                relative flex flex-col items-center justify-center rounded-md aspect-square text-sm font-medium
                transition-opacity select-none
                ${isWeekend || isFuture ? "opacity-30" : ""}
                ${!isWeekend && !isFuture ? STATUS_BG[cell.status] : "text-muted-foreground"}
                ${isToday ? "ring-2 ring-foreground ring-offset-1" : ""}
              `}
            >
              <span className={`text-xs font-semibold ${isWeekend || isFuture ? "text-muted-foreground" : ""}`}>
                {cell.day}
              </span>
              {hasStatus && (
                <span className="text-[8px] leading-none mt-0.5 opacity-80 hidden sm:block">
                  {cell.status === "half-day" ? "½" : cell.status === "present" ? "✓" : cell.status === "leave" ? "L" : "A"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border flex-wrap">
        {(Object.entries(STATUS_LABEL) as [AttendanceStatus, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold
              ${s === "present" ? "bg-foreground text-background" :
                s === "half-day" ? "bg-foreground/50 text-foreground" :
                s === "leave" ? "bg-foreground/20 text-foreground" :
                "bg-destructive/15 text-destructive"}`}>
              {s === "present" ? "✓" : s === "half-day" ? "½" : s === "leave" ? "L" : "A"}
            </div>
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded border border-border bg-muted/60" />
          No record
        </div>
      </div>
    </div>
  );
}
