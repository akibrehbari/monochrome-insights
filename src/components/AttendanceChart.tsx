import { type AttendanceRecord, type AttendanceStatus } from "@/lib/store";

interface Props {
  records: AttendanceRecord;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STATUS_CLASS: Record<AttendanceStatus | "weekend" | "future" | "none", string> = {
  present:  "bg-foreground",
  "half-day": "bg-foreground/50",
  leave:    "bg-foreground/25",
  absent:   "bg-muted-foreground/20",
  weekend:  "bg-transparent",
  future:   "bg-transparent",
  none:     "bg-muted/50",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  "half-day": "Half Day",
  leave: "Leave",
  absent: "Absent",
};

export function AttendanceChart({ records }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 52 weeks of cells ending today
  // Start from Monday 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - (52 * 7) + 1);
  // Align to Monday
  const dow = start.getDay(); // 0=Sun
  const daysToMon = dow === 0 ? 1 : (dow === 1 ? 0 : -(dow - 1));
  start.setDate(start.getDate() + daysToMon);

  // Build weeks: array of 52 weeks, each with 7 days (Mon-Sun)
  type Cell = { date: Date; iso: string; status: AttendanceStatus | "weekend" | "future" | "none" };
  const weeks: Cell[][] = [];

  let cursor = new Date(start);
  for (let w = 0; w < 53; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      const iso = date.toISOString().slice(0, 10);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      let status: Cell["status"] = "none";
      if (date > today) {
        status = "future";
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = "weekend";
      } else if (records[iso]) {
        status = records[iso];
      } else {
        status = "none";
      }
      week.push({ date, iso, status });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels — find which column each month starts in
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const firstWorkday = week.find((c) => c.status !== "weekend" && c.status !== "future");
    if (firstWorkday) {
      const d = firstWorkday.date;
      if (d.getDate() <= 7) {
        const label = d.toLocaleString("default", { month: "short" });
        if (!monthLabels.length || monthLabels[monthLabels.length - 1].label !== label) {
          monthLabels.push({ label, col: wi });
        }
      }
    }
  });

  // Stats
  const counts = { present: 0, "half-day": 0, leave: 0, absent: 0 };
  Object.values(records).forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  const total = counts.present + counts["half-day"] + counts.leave + counts.absent;
  const pct = total ? Math.round((counts.present / total) * 100) : 0;

  return (
    <div>
      {/* Stats row */}
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
          <span className="text-muted-foreground text-xs ml-1.5 uppercase tracking-widest">attendance rate</span>
        </div>
        <div className="flex gap-4 items-end pb-0.5">
          {(Object.entries(counts) as [AttendanceStatus, number][]).map(([s, n]) => (
            <div key={s} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{n}</span> {STATUS_LABEL[s]}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.col === wi);
              return (
                <div key={wi} style={{ width: 12, marginRight: 2 }} className="text-[9px] text-muted-foreground">
                  {ml ? ml.label : ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-2 justify-start">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} style={{ width: 10, height: 10 }} className="text-[9px] text-muted-foreground flex items-center">
                  {i < 5 ? d : ""}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px] mr-[2px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell.status !== "weekend" && cell.status !== "future" && cell.status !== "none"
                      ? `${cell.iso} — ${STATUS_LABEL[cell.status as AttendanceStatus]}`
                      : cell.iso}
                    className={`w-[10px] h-[10px] rounded-[2px] transition-opacity ${STATUS_CLASS[cell.status]}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 ml-8">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Less</span>
            {(["absent", "leave", "half-day", "present"] as AttendanceStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-[10px] h-[10px] rounded-[2px] ${STATUS_CLASS[s]}`} />
                <span className="text-[10px] text-muted-foreground">{STATUS_LABEL[s]}</span>
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
