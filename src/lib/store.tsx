import { createContext, useContext, useState, type ReactNode } from "react";

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
export type Month = typeof MONTHS[number];
export type MonthlyNumbers = Record<Month, number>;

export const emptyMonthly = (v = 0): MonthlyNumbers =>
  MONTHS.reduce((a, m) => ({ ...a, [m]: v }), {} as MonthlyNumbers);

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

export type Team = "Reddit" | "X" | "Meta" | "Video Editing" | "Management";
export type Employee = {
  id: string;
  name: string;
  role: string;
  team: Team;
  monthlySalary: number;
  monthlyBonus: number;
  notes: string;
};

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

const seedEmployees: Employee[] = [
  { id: uid(), name: "Sara Lin", role: "Reddit Lead", team: "Reddit", monthlySalary: 5200, monthlyBonus: 400, notes: "" },
  { id: uid(), name: "Tom Hayes", role: "X Strategist", team: "X", monthlySalary: 4800, monthlyBonus: 300, notes: "" },
  { id: uid(), name: "Ivy Park", role: "Meta Manager", team: "Meta", monthlySalary: 5400, monthlyBonus: 350, notes: "" },
  { id: uid(), name: "Owen Diaz", role: "Senior Editor", team: "Video Editing", monthlySalary: 5000, monthlyBonus: 250, notes: "" },
  { id: uid(), name: "Rae Okafor", role: "COO", team: "Management", monthlySalary: 7800, monthlyBonus: 600, notes: "" },
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
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [influencers, setInfluencers] = useState<Influencer[]>(seedInfluencers);
  const [proxies, setProxies] = useState<Proxy[]>(seedProxies);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [ops, setOps] = useState<OpsData>(seedOpsData);
  const [extras, setExtras] = useState<ForecastExtras>({
    otherRevenue: MONTHS.reduce((a, m) => ({ ...a, [m]: 1500 }), {} as MonthlyNumbers),
    miscellaneous: MONTHS.reduce((a, m) => ({ ...a, [m]: 400 }), {} as MonthlyNumbers),
  });
  return (
    <Ctx.Provider value={{ influencers, setInfluencers, proxies, setProxies, employees, setEmployees, ops, setOps, extras, setExtras }}>
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