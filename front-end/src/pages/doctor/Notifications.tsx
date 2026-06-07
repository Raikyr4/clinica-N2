import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/store/auth";
import { Bell } from "lucide-react";

export default function DoctorNotifications() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
          <Bell className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            Configure como e quando deseja receber alertas clínicos.
          </p>
        </div>
      </div>

      <NotificationPreferencesCard
        userId={user.id}
        role={user.role}
        description="Defina quais alertas deseja receber e para onde enviá-los."
      />
    </div>
  );
}
