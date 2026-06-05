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
  future:     "bg-transparent text-muted-foreground/20",
  weekend:    "bg-transparent text-muted-foreground/20",
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

type Cell = {
  day: number;
  iso: string;
  status: AttendanceStatus | "none" | "future" | "weekend";
} | null;

function buildMonthCells(year: number, month: number, records: AttendanceRecord, today: Date): Cell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const cells: Cell[] = Array(firstDow).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    let status: NonNullable<Cell>["status"];

    if (date > today)      status = "future";
    else if (isWeekend)    status = "weekend";
    else if (records[iso]) status = records[iso];
    else                   status = "none";

    cells.push({ day: d, iso, status });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function monthStats(year: number, month: number, records: AttendanceRecord, today: Date) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const counts: Record<AttendanceStatus, number> = { present: 0, "half-day": 0, leave: 0, absent: 0 };
  let total = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date > today) continue;
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    total++;
    const s = records[date.toISOString().slice(0, 10)] as AttendanceStatus | undefined;
    if (s) counts[s]++; else counts.absent++;
  }
  const pct = total ? Math.round(((counts.present + counts["half-day"] * 0.5) / total) * 100) : 0;
  return { counts, pct };
}

// ── Single Month Panel ────────────────────────────────────────────────────────
function MonthPanel({ year, month, records, today }: {
  year: number; month: number;
  records: AttendanceRecord; today: Date;
}) {
  const cells = buildMonthCells(year, month, records, today);
  const { counts, pct } = monthStats(year, month, records, today);
  const todayISO = today.toISOString().slice(0, 10);
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="flex-1 min-w-0">
      {/* Month name + rate */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">{monthName}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold tabular-nums">{pct}%</span>
          {(Object.entries(counts) as [AttendanceStatus, number][]).map(([s, n]) => (
            <div key={s} className="flex items-center gap-1 text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
              <span className="font-medium text-foreground">{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-[9px] uppercase tracking-widest text-muted-foreground text-center py-0.5">
            {d.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="aspect-square" />;

          const isToday = cell.iso === todayISO;
          const faded = cell.status === "weekend" || cell.status === "future";
          const hasStatus = !faded && cell.status !== "none";

          return (
            <div
              key={cell.iso}
              title={hasStatus ? `${cell.iso} — ${STATUS_LABEL[cell.status as AttendanceStatus]}` : cell.iso}
              className={`
                flex flex-col items-center justify-center rounded aspect-square select-none
                text-xs font-medium transition-opacity
                ${faded ? "opacity-20" : STATUS_BG[cell.status]}
                ${isToday ? "ring-2 ring-foreground ring-offset-1" : ""}
              `}
            >
              <span className="leading-none">{cell.day}</span>
              {hasStatus && (
                <span className="text-[7px] leading-none mt-0.5 opacity-75">
                  {cell.status === "present" ? "✓"
                    : cell.status === "half-day" ? "½"
                    : cell.status === "leave" ? "L" : "A"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Chart ────────────────────────────────────────────────────────────────
export function AttendanceChart({ records }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // "offset" = how many months back the LEFT panel starts from current month
  // 0 = left: current-1, right: current
  // 1 = left: current-2, right: current-1 … etc.
  const [offset, setOffset] = useState(0);

  // Compute the two months to show
  function monthAt(delta: number): { year: number; month: number } {
    let m = today.getMonth() - delta;
    let y = today.getFullYear();
    while (m < 0) { m += 12; y--; }
    return { year: y, month: m };
  }

  const left  = monthAt(offset + 1);  // one month before right
  const right = monthAt(offset);      // right panel

  const canGoNext = offset > 0;

  // Combined stats for both visible months
  const ls = monthStats(left.year,  left.month,  records, today);
  const rs = monthStats(right.year, right.month, records, today);
  const totalPresent = ls.counts.present + rs.counts.present;
  const totalHalf    = ls.counts["half-day"] + rs.counts["half-day"];
  const totalLeave   = ls.counts.leave + rs.counts.leave;
  const totalAbsent  = ls.counts.absent + rs.counts.absent;
  const totalDays    = totalPresent + totalHalf + totalLeave + totalAbsent;
  const overallPct   = totalDays
    ? Math.round(((totalPresent + totalHalf * 0.5) / totalDays) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Top bar: overall stats + navigation */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Overall rate */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-bold tabular-nums">{overallPct}%</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">rate</span>
          </div>
          {([
            ["present",  totalPresent, STATUS_DOT.present],
            ["half-day", totalHalf,    STATUS_DOT["half-day"]],
            ["leave",    totalLeave,   STATUS_DOT.leave],
            ["absent",   totalAbsent,  STATUS_DOT.absent],
          ] as [string, number, string][]).map(([s, n, dot]) => (
            <div key={s} className="flex items-center gap-1 text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="font-medium text-foreground">{n}</span>
              <span>{STATUS_LABEL[s as AttendanceStatus]}</span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(o => o + 1)}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Previous 2 months"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {new Date(left.year, left.month).toLocaleString("default", { month: "short" })}
            {" – "}
            {new Date(right.year, right.month).toLocaleString("default", { month: "short", year: "numeric" })}
          </span>
          <button
            onClick={() => setOffset(o => o - 1)}
            disabled={!canGoNext}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next 2 months"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Two-month grid */}
      <div className="grid grid-cols-2 gap-6">
        <MonthPanel year={left.year}  month={left.month}  records={records} today={today} />
        <MonthPanel year={right.year} month={right.month} records={records} today={today} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-3 border-t border-border flex-wrap">
        {(Object.entries(STATUS_LABEL) as [AttendanceStatus, string][]).map(([s, label]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold
              ${s === "present"  ? "bg-foreground text-background" :
                s === "half-day" ? "bg-foreground/50 text-foreground" :
                s === "leave"    ? "bg-foreground/20 text-foreground" :
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
