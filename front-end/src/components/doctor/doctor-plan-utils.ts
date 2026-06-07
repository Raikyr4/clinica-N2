import type { DoctorPlanOption } from "@/types/api";

export function formatDoctorPlanPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function getHighlightedDoctorPlan(plans: DoctorPlanOption[]) {
  return plans.find((plan) => plan.includes_ai_chatbot) ?? plans[Math.min(1, Math.max(plans.length - 1, 0))];
}
