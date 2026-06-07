import { Badge } from "@/components/ui/badge";
import {
  AppointmentStatus,
  AppointmentStatusLabel,
  PaymentStatus,
  PaymentStatusLabel,
  SlotStatus,
  SlotStatusLabel,
} from "@/types/api";

interface StatusBadgeProps {
  status: AppointmentStatus | PaymentStatus | SlotStatus;
  type: "appointment" | "payment" | "slot";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const appointmentVariant: Record<AppointmentStatus, "default" | "outline" | "destructive"> = {
    [AppointmentStatus.AGENDADA]: "default",
    [AppointmentStatus.REALIZADA]: "outline",
    [AppointmentStatus.CANCELADA]: "destructive",
  };

  const paymentVariant: Record<PaymentStatus, "default" | "secondary" | "destructive"> = {
    [PaymentStatus.APROVADO]: "default",
    [PaymentStatus.NEGADO]: "destructive",
    [PaymentStatus.ESTORNADO]: "secondary",
  };

  const slotVariant: Record<SlotStatus, "default" | "secondary" | "outline" | "destructive"> = {
    [SlotStatus.LIVRE]: "outline",
    [SlotStatus.RESERVADO]: "default",
    [SlotStatus.CONCLUIDO]: "secondary",
    [SlotStatus.CANCELADO]: "destructive",
  };

  const getVariant = () => {
    if (type === "appointment") {
      return appointmentVariant[status as AppointmentStatus];
    }

    if (type === "payment") {
      return paymentVariant[status as PaymentStatus];
    }

    return slotVariant[status as SlotStatus];
  };

  const getLabel = () => {
    if (type === "appointment") {
      return AppointmentStatusLabel[status as AppointmentStatus];
    }

    if (type === "payment") {
      return PaymentStatusLabel[status as PaymentStatus];
    }

    return SlotStatusLabel[status as SlotStatus];
  };

  return (
    <Badge variant={getVariant()} className="font-medium">
      {getLabel()}
    </Badge>
  );
}
