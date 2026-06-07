import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EtapaAgendamento } from "@/context/AgendamentoContext";

const steps: { id: EtapaAgendamento; label: string }[] = [
  { id: "MODALIDADE", label: "Modalidade" },
  { id: "ESPECIALIDADE", label: "Especialidade" },
  { id: "MEDICO", label: "Medico" },
  { id: "AGENDA", label: "Agenda" },
  { id: "PACIENTE", label: "Paciente" },
  { id: "CONFIRMACAO", label: "Confirmacao" },
  { id: "COMPROVANTE", label: "Comprovante" },
];

export function Stepper({ etapaAtual }: { etapaAtual: EtapaAgendamento }) {
  const currentIndex = steps.findIndex((step) => step.id === etapaAtual);

  return (
    <nav aria-label="Etapas do agendamento" className="grid gap-2 sm:grid-cols-7">
      {steps.map((step, index) => {
        const active = index === currentIndex;
        const complete = index < currentIndex;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
              active && "border-primary bg-primary text-primary-foreground",
              complete && "border-emerald-200 bg-emerald-50 text-emerald-700",
              !active && !complete && "bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                active && "border-primary-foreground",
                complete && "border-emerald-500 bg-emerald-500 text-white",
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="truncate">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
