import { useMutation } from "@tanstack/react-query";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useAgendamento } from "@/context/AgendamentoContext";
import { confirmarConsulta } from "@/services/consultaService";
import { getErrorMessage } from "@/services/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export function Etapa6Confirmacao() {
  const { state, dispatch } = useAgendamento();
  const { toast } = useToast();
  const agenda = state.agendaSelecionada!;
  const paciente = state.pacienteSelecionado!;

  const mutation = useMutation({
    mutationFn: () =>
      confirmarConsulta({
        crmMedico: agenda.crmMedico,
        codEspecialidade: agenda.codEspecialidade,
        data: agenda.data,
        horario: agenda.horario,
        codPaciente: paciente.codigo,
        tipo: state.modalidade!,
        codPlanoSaude: state.codPlanoSaude,
        opcaoAgendamentoId: state.opcaoAgendamentoId,
      }),
    onSuccess: (comprovante) => dispatch({ type: "SET_COMPROVANTE", comprovante }),
    onError: (error) => toast({ title: "Agendamento nao concluido", description: getErrorMessage(error), variant: "destructive" }),
  });

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Confirmar agendamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Resumo label="Paciente" value={paciente.nome} />
          <Resumo label="Mae" value={paciente.nomeMae} />
          <Resumo label="Medico" value={agenda.nomeMedico} />
          <Resumo label="Especialidade" value={agenda.nomeEspecialidade} />
          <Resumo label="Data" value={new Date(`${agenda.data}T00:00:00`).toLocaleDateString("pt-BR")} />
          <Resumo label="Horario" value={agenda.horario.substring(0, 5)} />
          <Resumo label="Modalidade" value={state.modalidade === "C" ? "Convenio" : "Particular"} />
          <Resumo label="Plano" value={state.planoNome || "Nao informado"} />
        </div>
        <Separator />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => dispatch({ type: "VOLTAR" })}>
            Corrigir dados
          </Button>
          <Button size="lg" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
