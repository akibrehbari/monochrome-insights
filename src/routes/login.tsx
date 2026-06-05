import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, ROLE_HOME, MOCK_USERS } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Already logged in
  if (user) {
    navigate({ to: ROLE_HOME[user.role] });
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ok = login(email, password);
    if (!ok) {
      setError("Invalid email or password.");
      return;
    }
    const u = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (u) navigate({ to: ROLE_HOME[u.role] });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
            eLeopards Agency
          </div>
          <h1 className="text-2xl font-semibold">Ledger / OS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@eleopards.com"
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-foreground text-background font-medium py-2 px-4 rounded text-sm hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-8 border border-border rounded p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Demo Credentials
          </div>
          {[
            { label: "Admin", email: "admin@eleopards.com", pw: "admin123" },
            { label: "HR", email: "hr@eleopards.com", pw: "hr123" },
            { label: "Employee", email: "sara@eleopards.com", pw: "sara123" },
          ].map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => { setEmail(d.email); setPassword(d.pw); setError(""); }}
              className="w-full text-left px-3 py-1.5 rounded text-xs border border-border hover:bg-accent transition-colors flex justify-between"
            >
              <span className="font-medium">{d.label}</span>
              <span className="text-muted-foreground">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
