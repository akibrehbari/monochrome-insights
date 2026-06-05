import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction } from "react";

// Bump this version string whenever you want to wipe all cached data and reseed
const STORE_VERSION = "v3";
const VERSION_KEY   = "el_store_version";

// On first load, if version doesn't match wipe all store keys
const STORE_KEYS = ["el_influencers","el_proxies","el_employees","el_ops","el_extras","el_sops","el_attendance"];
if (typeof window !== "undefined") {
  if (localStorage.getItem(VERSION_KEY) !== STORE_VERSION) {
    STORE_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, STORE_VERSION);
  }
}

// Persists state to localStorage — reads seed only on first ever load
function useLocalState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored) as T;
    } catch { /* ignore */ }
    return seed;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [key, state]);

  return [state, setState];
}

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
export type Month = typeof MONTHS[number];
export type MonthlyNumbers = Record<Month, number>;

export const emptyMonthly = (v = 0): MonthlyNumbers =>
  MONTHS.reduce((a, m) => ({ ...a, [m]: v }), {} as MonthlyNumbers);

export type Role = "admin" | "hr" | "employee";

// ---------- SOP ----------
export type SOP = {
  id: string;
  title: string;
  content: string;
  category: string;
  assignedRoles: Role[];
  createdAt: string;
};

// ---------- Attendance ----------
export type AttendanceStatus = "present" | "absent" | "half-day" | "leave";
export type AttendanceRecord = Record<string, AttendanceStatus>; // ISO date -> status
export type AttendanceMap = Record<string, AttendanceRecord>;   // employeeId -> records

// ---------- Influencer ----------
export type Influencer = {
  id: string;
  name: string;
  screenName: string;
  redditAccount: string;
  email: string;
  proxyId: string;
  niche: string;
  driveLink: string;
  monthlyRevenue: number;
  monthlyCost: number;
  notes: string;
};

// ---------- Proxy ----------
export type Proxy = {
  id: string;
  provider: string;
  currentIp: string;
  changeUrl: string;
  monthlyCost: number;
  renewalDate: string;
  status: "Active" | "Expired";
  assignedInfluencer: string;
  notes: string;
};

// ---------- Employee ----------
export type Team = "Reddit" | "X" | "Meta" | "Video Editing" | "Management" | "IT";
export type SystemRole = "admin" | "hr" | "employee" | "";

export type Employee = {
  id: string;
  name: string;
  role: string;           // job title e.g. "Reddit Lead"
  systemRole: SystemRole; // platform role
  team: Team;
  monthlySalary: number;
  monthlyBonus: number;
  notes: string;
  username?: string;      // login email/username
  password?: string;      // login password (shown only to admin/HR)
};

// ---------- Ops ----------
export type OpsChannel = "Reddit" | "X" | "Meta" | "Video Editing";
export type OpsRow = {
  id: string;
  item: string;
  values: MonthlyNumbers;
};
export type OpsData = Record<OpsChannel, OpsRow[]>;

export type ForecastExtras = {
  otherRevenue: MonthlyNumbers;
  miscellaneous: MonthlyNumbers;
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ---------- Seeds ----------
const seedInfluencers: Influencer[] = [
  { id: uid(), name: "Ava Reed", screenName: "@avareed", redditAccount: "u/avareed", email: "ava@agency.io", proxyId: "PRX-001", niche: "Fitness", driveLink: "https://drive.google.com/ava", monthlyRevenue: 8200, monthlyCost: 1200, notes: "Top performer" },
  { id: uid(), name: "Liam Cole", screenName: "@liamcole", redditAccount: "u/liamc", email: "liam@agency.io", proxyId: "PRX-002", niche: "Finance", driveLink: "https://drive.google.com/liam", monthlyRevenue: 6400, monthlyCost: 900, notes: "" },
  { id: uid(), name: "Maya Quinn", screenName: "@mayaq", redditAccount: "u/mayaq", email: "maya@agency.io", proxyId: "PRX-003", niche: "Lifestyle", driveLink: "https://drive.google.com/maya", monthlyRevenue: 5100, monthlyCost: 800, notes: "" },
  { id: uid(), name: "Noah Kim", screenName: "@noahk", redditAccount: "u/noahk", email: "noah@agency.io", proxyId: "PRX-004", niche: "Tech", driveLink: "https://drive.google.com/noah", monthlyRevenue: 7300, monthlyCost: 1100, notes: "" },
];

const seedProxies: Proxy[] = [
  { id: "PRX-001", provider: "ProxyEmpire", currentIp: "192.168.10.4", changeUrl: "https://proxyempire.io/change/001", monthlyCost: 25, renewalDate: "2026-09-12", status: "Active", assignedInfluencer: "Ava Reed", notes: "" },
  { id: "PRX-002", provider: "Bright Data", currentIp: "10.0.0.55", changeUrl: "https://brightdata.com/change/002", monthlyCost: 30, renewalDate: "2026-08-04", status: "Active", assignedInfluencer: "Liam Cole", notes: "" },
  { id: "PRX-003", provider: "Smartproxy", currentIp: "172.16.4.21", changeUrl: "https://smartproxy.com/change/003", monthlyCost: 22, renewalDate: "2026-07-19", status: "Active", assignedInfluencer: "Maya Quinn", notes: "" },
  { id: "PRX-004", provider: "ProxyEmpire", currentIp: "192.168.10.9", changeUrl: "https://proxyempire.io/change/004", monthlyCost: 25, renewalDate: "2026-06-02", status: "Expired", assignedInfluencer: "Noah Kim", notes: "Renew" },
];

// Fixed IDs so auth system can reference them
export const seedEmployees: Employee[] = [
  { id: "emp_sara",  name: "Sara Lin",   role: "Reddit Lead",    systemRole: "employee", team: "Reddit",         monthlySalary: 5200, monthlyBonus: 400, notes: "" },
  { id: "emp_tom",   name: "Tom Hayes",  role: "X Strategist",   systemRole: "employee", team: "X",              monthlySalary: 4800, monthlyBonus: 300, notes: "" },
  { id: "emp_ivy",   name: "Ivy Park",   role: "Meta Manager",   systemRole: "employee", team: "Meta",           monthlySalary: 5400, monthlyBonus: 350, notes: "" },
  { id: "emp_owen",  name: "Owen Diaz",  role: "Senior Editor",  systemRole: "employee", team: "Video Editing",  monthlySalary: 5000, monthlyBonus: 250, notes: "" },
  { id: "emp_rae",   name: "Rae Okafor", role: "COO",            systemRole: "hr",       team: "Management",     monthlySalary: 7800, monthlyBonus: 600, notes: "" },
];

const defaultOpsItems = ["Software/Tools", "Ads/Promoted Posts", "Content Creation", "Misc"];
const seedOps = (base: number): OpsRow[] =>
  defaultOpsItems.map((item, i) => ({
    id: uid(),
    item,
    values: MONTHS.reduce((a, m) => ({ ...a, [m]: base + i * 80 }), {} as MonthlyNumbers),
  }));

const seedOpsData: OpsData = {
  Reddit: seedOps(400),
  X: seedOps(350),
  Meta: seedOps(500),
  "Video Editing": seedOps(300),
};

// ---------- SOP seeds ----------
const seedSOPs: SOP[] = [
  {
    id: "sop_001",
    title: "Content Creation Guidelines",
    category: "Content",
    assignedRoles: ["admin", "hr", "employee"],
    createdAt: "2026-01-10",
    content: `## Content Creation Guidelines

### Purpose
Ensure all content produced meets eLeopards quality standards.

### Guidelines
1. All posts must be original and not copied from other sources.
2. Use approved brand voice: professional, engaging, and authentic.
3. Proofread all content before publishing — zero typos tolerated.
4. Schedule posts during peak engagement windows (8–10am, 12–1pm, 7–9pm).
5. Tag relevant accounts and use approved hashtag sets only.

### Approval Process
- Draft → Peer review → Manager sign-off → Publish.
- Urgent posts can bypass peer review with manager approval.

### Compliance
Never make claims that cannot be substantiated. When in doubt, escalate to management.`,
  },
  {
    id: "sop_002",
    title: "Employee Onboarding Checklist",
    category: "HR",
    assignedRoles: ["admin", "hr"],
    createdAt: "2026-01-15",
    content: `## Employee Onboarding Checklist

### Pre-Start
- [ ] Send offer letter and obtain signed copy
- [ ] Set up company email account
- [ ] Add to Slack and relevant channels
- [ ] Assign proxy and accounts

### Day 1
- [ ] Office/remote setup walkthrough
- [ ] Introduce to team and manager
- [ ] Review company policies and this SOP library
- [ ] Set up 2FA on all company accounts

### Week 1
- [ ] Complete role-specific training
- [ ] Shadow senior team member for 3 days
- [ ] Set 30/60/90-day goals with manager

### Payroll
- [ ] Confirm bank details and salary agreement
- [ ] Add to payroll system by end of Day 2`,
  },
  {
    id: "sop_003",
    title: "Proxy & Account Security Protocol",
    category: "Operations",
    assignedRoles: ["admin", "employee"],
    createdAt: "2026-02-01",
    content: `## Proxy & Account Security Protocol

### Proxy Usage
- Always connect to your assigned proxy before accessing any agency account.
- Never share proxy credentials with anyone outside the team.
- Report IP changes or bans to operations immediately.

### Account Security
- Use unique, strong passwords for every platform (min. 16 chars).
- Enable 2FA on all accounts — no exceptions.
- Never log into accounts from personal devices.
- Log out of all accounts before disconnecting proxy.

### Incident Response
If an account is flagged or banned:
1. Stop all activity immediately.
2. Notify your manager within 30 minutes.
3. Document the incident in the ops channel.
4. Do not attempt to recover the account without guidance.`,
  },
  {
    id: "sop_004",
    title: "Payroll & Bonus Policy",
    category: "HR",
    assignedRoles: ["admin", "hr", "employee"],
    createdAt: "2026-02-10",
    content: `## Payroll & Bonus Policy

### Salary Payment
- Salaries are paid on the 1st of each month via bank transfer.
- Payslips are sent to your registered email on the 28th of the prior month.

### Bonuses
- Monthly performance bonuses are assessed by your team lead.
- Bonus criteria: KPI achievement, attendance, and peer feedback.
- Bonuses are paid alongside the monthly salary.

### Deductions
- Unapproved absences: 1 day deducted per occurrence after 2 warnings.
- Late arrivals (>15 min, 3+ in a month): 0.5-day deduction.

### Queries
Direct all payroll queries to hr@eleopards.com within 5 days of receiving your payslip.`,
  },
  {
    id: "sop_005",
    title: "Leave & Attendance Policy",
    category: "HR",
    assignedRoles: ["admin", "hr", "employee"],
    createdAt: "2026-02-15",
    content: `## Leave & Attendance Policy

### Working Hours
Standard hours: 9:00 AM – 6:00 PM (PKT), Monday to Friday.
Remote workers must be online and responsive during core hours.

### Leave Entitlement
- Annual leave: 18 days per year
- Sick leave: 10 days per year (medical certificate required for 3+ consecutive days)
- Casual leave: 6 days per year

### Leave Application
Submit leave requests at least 48 hours in advance via your manager.
Emergency leave must be communicated before shift start.

### Attendance Tracking
Attendance is recorded daily. Three unexcused absences in a month will trigger a formal review.`,
  },
];

// ---------- Attendance seed ----------
function generateAttendance(employeeId: string): AttendanceRecord {
  const records: AttendanceRecord = {};
  const today = new Date();
  // Generate last 365 days
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) continue; // skip weekends
    const key = d.toISOString().slice(0, 10);
    // Deterministic pseudo-random based on employeeId + date
    const seed = (employeeId.charCodeAt(4) || 1) * 7 + i;
    const r = seed % 20;
    if (r < 14)       records[key] = "present";
    else if (r < 16)  records[key] = "half-day";
    else if (r < 18)  records[key] = "leave";
    else              records[key] = "absent";
  }
  return records;
}

const seedAttendance: AttendanceMap = Object.fromEntries(
  seedEmployees.map((e) => [e.id, generateAttendance(e.id)])
);

// ---------- Store ----------
type Store = {
  influencers: Influencer[];
  setInfluencers: React.Dispatch<React.SetStateAction<Influencer[]>>;
  proxies: Proxy[];
  setProxies: React.Dispatch<React.SetStateAction<Proxy[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  ops: OpsData;
  setOps: React.Dispatch<React.SetStateAction<OpsData>>;
  extras: ForecastExtras;
  setExtras: React.Dispatch<React.SetStateAction<ForecastExtras>>;
  sops: SOP[];
  setSOPs: React.Dispatch<React.SetStateAction<SOP[]>>;
  attendance: AttendanceMap;
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMap>>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useLocalState<Influencer[]>("el_influencers", seedInfluencers);
  const [proxies, setProxies] = useLocalState<Proxy[]>("el_proxies", seedProxies);
  const [employees, setEmployees] = useLocalState<Employee[]>("el_employees", seedEmployees);
  const [ops, setOps] = useLocalState<OpsData>("el_ops", seedOpsData);
  const [extras, setExtras] = useLocalState<ForecastExtras>("el_extras", {
    otherRevenue: MONTHS.reduce((a, m) => ({ ...a, [m]: 1500 }), {} as MonthlyNumbers),
    miscellaneous: MONTHS.reduce((a, m) => ({ ...a, [m]: 400 }), {} as MonthlyNumbers),
  });
  const [sops, setSOPs] = useLocalState<SOP[]>("el_sops", seedSOPs);
  const [attendance, setAttendance] = useLocalState<AttendanceMap>("el_attendance", seedAttendance);

  return (
    <Ctx.Provider value={{
      influencers, setInfluencers,
      proxies, setProxies,
      employees, setEmployees,
      ops, setOps,
      extras, setExtras,
      sops, setSOPs,
      attendance, setAttendance,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

// ---------- Derived helpers ----------
export function sumMonthly(m: MonthlyNumbers) {
  return MONTHS.reduce((s, k) => s + (Number(m[k]) || 0), 0);
}

export function buildMonthly(store: Store) {
  const influencerRevenue = emptyMonthly();
  const proxyCosts = emptyMonthly();
  const salaries = emptyMonthly();
  const bonuses = emptyMonthly();
  const opsByChannel: Record<OpsChannel, MonthlyNumbers> = {
    Reddit: emptyMonthly(), X: emptyMonthly(), Meta: emptyMonthly(), "Video Editing": emptyMonthly(),
  };

  const totalInfluencerRev = store.influencers.reduce((s, i) => s + i.monthlyRevenue, 0);
  const totalInfluencerCost = store.influencers.reduce((s, i) => s + i.monthlyCost, 0);
  const totalProxy = store.proxies.filter(p => p.status === "Active").reduce((s, p) => s + p.monthlyCost, 0);
  const totalSalaries = store.employees.reduce((s, e) => s + e.monthlySalary, 0);
  const totalBonuses = store.employees.reduce((s, e) => s + e.monthlyBonus, 0);

  MONTHS.forEach(m => {
    influencerRevenue[m] = totalInfluencerRev;
    proxyCosts[m] = totalProxy + totalInfluencerCost;
    salaries[m] = totalSalaries;
    bonuses[m] = totalBonuses;
    (Object.keys(opsByChannel) as OpsChannel[]).forEach(ch => {
      opsByChannel[ch][m] = store.ops[ch].reduce((s, r) => s + (Number(r.values[m]) || 0), 0);
    });
  });

  return { influencerRevenue, proxyCosts, salaries, bonuses, opsByChannel };
}
