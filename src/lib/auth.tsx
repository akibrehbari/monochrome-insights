import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "admin" | "hr" | "employee";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string;
};

type MockUser = AuthUser & { password: string };

export const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Admin", email: "admin@eleopards.com", role: "admin", password: "admin123" },
  { id: "u2", name: "HR Manager", email: "hr@eleopards.com", role: "hr", password: "hr123" },
  { id: "u3", name: "Sara Lin", email: "sara@eleopards.com", role: "employee", employeeId: "emp_sara", password: "sara123" },
  { id: "u4", name: "Tom Hayes", email: "tom@eleopards.com", role: "employee", employeeId: "emp_tom", password: "tom123" },
  { id: "u5", name: "Ivy Park", email: "ivy@eleopards.com", role: "employee", employeeId: "emp_ivy", password: "ivy123" },
  { id: "u6", name: "Owen Diaz", email: "owen@eleopards.com", role: "employee", employeeId: "emp_owen", password: "owen123" },
  { id: "u7", name: "Rae Okafor", email: "rae@eleopards.com", role: "employee", employeeId: "emp_rae", password: "rae123" },
];

type AuthState = {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const s = localStorage.getItem("eleopards_auth");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const login = (email: string, password: string): boolean => {
    // 1. Check hardcoded admin/HR/seed accounts first
    const hardcoded = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (hardcoded) {
      const { password: _pw, ...u } = hardcoded;
      setUser(u);
      localStorage.setItem("eleopards_auth", JSON.stringify(u));
      return true;
    }

    // 2. Check employees added via the HR/Admin dashboard (stored in localStorage)
    try {
      const stored = localStorage.getItem("el_employees");
      if (stored) {
        const employees: Array<{
          id: string; name: string; username?: string;
          password?: string; systemRole?: string;
        }> = JSON.parse(stored);

        const emp = employees.find(
          (e) =>
            e.username &&
            e.password &&
            e.username.toLowerCase() === email.toLowerCase() &&
            e.password === password &&
            e.systemRole && e.systemRole !== ""
        );

        if (emp && emp.systemRole) {
          const role = emp.systemRole as Role;
          const authUser: AuthUser = {
            id: emp.id,
            name: emp.name,
            email: emp.username!,
            role,
            employeeId: role === "employee" ? emp.id : undefined,
          };
          setUser(authUser);
          localStorage.setItem("eleopards_auth", JSON.stringify(authUser));
          return true;
        }
      }
    } catch { /* ignore parse errors */ }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eleopards_auth");
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}

export const ROLE_HOME: Record<Role, string> = {
  admin: "/",
  hr: "/employees",
  employee: "/my-portal",
};

/** Which nav resources each role can access */
export const ROLE_ACCESS: Record<string, Role[]> = {
  dashboard: ["admin"],
  influencers: ["admin"],
  proxies: ["admin"],
  forecast: ["admin"],
  operations: ["admin"],
  employees: ["admin", "hr"],
  sops: ["admin", "hr", "employee"],
  "my-portal": ["employee"],
};

export function canAccess(role: Role, resource: string) {
  return ROLE_ACCESS[resource]?.includes(role) ?? false;
}
