import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { UserRole } from "@/types/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return <LoadingSpinner size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <LoadingSpinner size="lg" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<UserRole, string> = {
      [UserRole.MEDICO]: "/doctor/dashboard",
      [UserRole.PACIENTE]: "/app/dashboard"
    };
    return <Navigate to={redirectMap[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}
