import { useQuery } from "@tanstack/react-query";
import { CalendarX, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgendamento } from "@/context/AgendamentoContext";
import { AgendaCard } from "@/components/AgendaCard";
import { listarAgendasEspecialidade, listarAgendasMedico } from "@/services/agendaService";
import { registrarOpcao } from "@/services/consultaService";
import { getErrorMessage } from "@/services/http";
import { AgendaDisponivel } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

export function Etapa4Agenda() {
  const { state, dispatch } = useAgendamento();
  const { toast } = useToast();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: [
      "agendas",
      state.codEspecialidade,
      state.crmMedico,
      state.semPreferenciaMedico,
      state.codPlanoSaude,
      state.offsetAgenda,
    ],
    queryFn: () =>
      state.semPreferenciaMedico
        ? listarAgendasEspecialidade(state.codEspecialidade!, state.offsetAgenda, state.codPlanoSaude)
        : listarAgendasMedico(state.crmMedico!, state.codEspecialidade!, state.offsetAgenda, state.codPlanoSaude),
    enabled: Boolean(state.codEspecialidade && (state.semPreferenciaMedico || state.crmMedico)),
  });

  const selecionarAgenda = async (agenda: AgendaDisponivel) => {
    try {
      const opcao = await registrarOpcao(agenda.crmMedico, agenda.codEspecialidade, agenda.data, agenda.horario);
      dispatch({ type: "SELECIONAR_AGENDA", agenda, opcaoAgendamentoId: opcao.opcaoAgendamentoId });
    } catch (error) {
      toast({ title: "Horário indisponível", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const irParaListaEspera = () => {
    const params = new URLSearchParams();
    if (!state.semPreferenciaMedico && state.crmMedico) {
      params.set("crmMedico", String(state.crmMedico));
      params.set("medicoNome", state.medicoNome);
    }
    params.set("codEspecialidade", String(state.codEspecialidade));
    params.set("espNome", state.especialidadeNome);
    params.set("semPreferencia", String(state.semPreferenciaMedico));
    navigate(`/lista-espera?${params.toString()}`);
  };

  if (query.isLoading) return <LoadingSpinner label="Consultando os próximos horários..." />;

  const agendas = query.data ?? [];

  if (agendas.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Nenhum horário disponível</h3>
            <p className="max-w-lg text-muted-foreground">
              Não há agendas disponíveis para os critérios selecionados nas próximas semanas.
              Você pode voltar para escolher outro médico ou entrar na lista de espera.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => dispatch({ type: "VOLTAR" })}>
                Escolher outro médico
              </Button>
              <Button onClick={irParaListaEspera}>
                <Clock className="mr-2 h-4 w-4" />
                Entrar na lista de espera
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {agendas.map((agenda) => (
        <AgendaCard
          key={`${agenda.crmMedico}-${agenda.data}-${agenda.horario}`}
          agenda={agenda}
          onSelecionar={selecionarAgenda}
        />
      ))}

      <Separator />

      {/* Cenário 7a: ver mais opções | Cenário 7b: lista de espera */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={irParaListaEspera}>
          <Clock className="mr-2 h-4 w-4" />
          Nenhum horário me agrada — lista de espera
        </Button>
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "SET_OFFSET_AGENDA", offset: state.offsetAgenda + 1 })}
        >
          Ver outros horários
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
