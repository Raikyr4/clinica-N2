import { UserRound } from "lucide-react";
import { Paciente } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PacienteCard({
  paciente,
  onSelecionar,
}: {
  paciente: Paciente;
  onSelecionar: (paciente: Paciente) => void;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-semibold">
            <UserRound className="h-4 w-4 text-primary" />
            {paciente.nome}
          </div>
          <p className="text-sm text-muted-foreground">Mae: {paciente.nomeMae}</p>
          <p className="text-sm text-muted-foreground">
            Nascimento: {new Date(`${paciente.dataNasc}T00:00:00`).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <Button onClick={() => onSelecionar(paciente)}>Selecionar paciente</Button>
      </CardContent>
    </Card>
  );
}
