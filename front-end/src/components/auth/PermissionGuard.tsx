import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { UserRole } from "@/types/api";

export function PermissionGuard({ required }: { required: string[] }) {
  const { user } = useAuthStore();

    return <Outlet />;
}
