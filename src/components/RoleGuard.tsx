import { Navigate } from "@tanstack/react-router";
import { useAuth, ROLE_HOME, type Role } from "@/lib/auth";

interface Props {
  allowed: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowed, children }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (!allowed.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} />;
  }

  return <>{children}</>;
}
