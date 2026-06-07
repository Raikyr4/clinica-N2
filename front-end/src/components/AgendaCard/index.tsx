import { CalendarDays, Clock, Stethoscope } from "lucide-react";
import { AgendaDisponivel } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AgendaCard({
  agenda,
  onSelecionar,
}: {
  agenda: AgendaDisponivel;
  onSelecionar: (agenda: AgendaDisponivel) => void;
}) {
  return (
    <Card className="border-l-4 border-l-primary shadow-card">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Stethoscope className="h-4 w-4 text-primary" />
            {agenda.nomeMedico}
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatarData(agenda.data)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {agenda.horario.substring(0, 5)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{agenda.nomeEspecialidade}</p>
        </div>

        <Button size="lg" onClick={() => onSelecionar(agenda)}>
          Escolher horario
        </Button>
      </CardContent>
    </Card>
  );
}
