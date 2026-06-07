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
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <UserRound className="h-4 w-4 text-primary" />
            {paciente.nome}
          </div>
          <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <Linha label="Codigo" value={String(paciente.codigo)} />
            <Linha label="Mae" value={paciente.nomeMae} />
            <Linha label="Nascimento" value={new Date(`${paciente.dataNasc}T00:00:00`).toLocaleDateString("pt-BR")} />
            <Linha label="Sexo" value={paciente.sexo} />
            <Linha label="Telefone" value={paciente.telefone} />
            <Linha label="CPF" value={paciente.cpf || "Nao informado"} />
            <Linha label="Endereco" value={paciente.endereco} />
            <Linha label="Plano" value={paciente.planoSaude || "Sem plano"} />
            {paciente.nomeResponsavel && <Linha label="Responsavel" value={paciente.nomeResponsavel} />}
            {paciente.telefoneResponsavel && <Linha label="Tel. responsavel" value={paciente.telefoneResponsavel} />}
          </dl>
        </div>

        <Button className="shrink-0" onClick={() => onSelecionar(paciente)}>Selecionar paciente</Button>
      </CardContent>
    </Card>
  );
}

function Linha({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase text-muted-foreground/80">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
