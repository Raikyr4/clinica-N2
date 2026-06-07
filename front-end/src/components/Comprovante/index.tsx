import { CalendarCheck, Printer } from "lucide-react";
import { ComprovanteAgendamento } from "@/types/Clinica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Comprovante({ comprovante }: { comprovante: ComprovanteAgendamento }) {
  return (
    <Card className="mx-auto max-w-2xl border-primary/20 bg-white shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Printer className="h-6 w-6" />
        </div>
        <CardTitle>Comprovante de agendamento</CardTitle>
        <p className="text-sm text-muted-foreground">Consulta agendada com sucesso.</p>
      </CardHeader>
      <CardContent className="space-y-4 font-mono text-sm">
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 font-sans text-emerald-700">
          <CalendarCheck className="h-5 w-5" />
          Compareca com 15 minutos de antecedencia.
        </div>
        <Separator />
        <div className="grid gap-3 sm:grid-cols-2">
          <Linha label="Numero" value={String(comprovante.codigo)} />
          <Linha label="Situacao" value={comprovante.situacao} />
          <Linha label="Data" value={new Date(`${comprovante.data}T00:00:00`).toLocaleDateString("pt-BR")} />
          <Linha label="Horario" value={comprovante.horario.substring(0, 5)} />
          <Linha label="Paciente" value={comprovante.nomePaciente} />
          <Linha label="Medico" value={comprovante.nomeMedico} />
          <Linha label="CRM" value={String(comprovante.crmMedico)} />
          <Linha label="Especialidade" value={comprovante.nomeEspecialidade} />
          <Linha label="Modalidade" value={comprovante.modalidade} />
          <Linha label="Plano" value={comprovante.planoSaude || "Particular"} />
        </div>
      </CardContent>
    </Card>
  );
}

function Linha({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
