import { ArrowLeft, Heart, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AgendamentoProvider, useAgendamento } from "@/context/AgendamentoContext";
import { Stepper } from "@/components/Stepper";
import { Comprovante } from "@/components/Comprovante";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Etapa1Modalidade } from "./Etapa1Modalidade";
import { Etapa2Especialidade } from "./Etapa2Especialidade";
import { Etapa3Medico } from "./Etapa3Medico";
import { Etapa4Agenda } from "./Etapa4Agenda";
import { Etapa5Paciente } from "./Etapa5Paciente";
import { Etapa6Confirmacao } from "./Etapa6Confirmacao";

const textos = {
  MODALIDADE: {
    titulo: "Como deseja agendar?",
    subtitulo: "Escolha atendimento particular ou por convenio para iniciar a busca.",
  },
  ESPECIALIDADE: {
    titulo: "Escolha a especialidade",
    subtitulo: "A lista considera a modalidade selecionada.",
  },
  MEDICO: {
    titulo: "Escolha o medico",
    subtitulo: "Tambem e possivel seguir sem preferencia por profissional.",
  },
  AGENDA: {
    titulo: "Escolha data e horario",
    subtitulo: "Mostramos as tres primeiras opcoes disponiveis.",
  },
  PACIENTE: {
    titulo: "Identifique o paciente",
    subtitulo: "Busque pelo nome e nome da mae ou cadastre um novo paciente.",
  },
  CONFIRMACAO: {
    titulo: "Revise os dados",
    subtitulo: "Confira as informacoes antes de confirmar a consulta.",
  },
  COMPROVANTE: {
    titulo: "Agendamento concluido",
    subtitulo: "Guarde as informacoes do comprovante.",
  },
};

function AgendamentoConteudo() {
  const { state, dispatch } = useAgendamento();
  const navigate = useNavigate();
  const texto = textos[state.etapa];

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/70 to-background px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-md border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Voltar ao início"
              >
                <Heart className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold uppercase text-primary">Clínica SafeCare</p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Agendamento de consulta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  CSU1 — Agendar Consulta WEB · Preencha as etapas abaixo
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => dispatch({ type: "REINICIAR" })}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Novo agendamento
            </Button>
          </div>
        </header>

        <Stepper etapaAtual={state.etapa} />

        <Card className="shadow-elevated">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{texto.titulo}</CardTitle>
              <p className="mt-2 text-muted-foreground">{texto.subtitulo}</p>
            </div>
            {state.etapa !== "MODALIDADE" && state.etapa !== "COMPROVANTE" && (
              <Button variant="ghost" onClick={() => dispatch({ type: "VOLTAR" })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {state.etapa === "MODALIDADE" && <Etapa1Modalidade />}
            {state.etapa === "ESPECIALIDADE" && <Etapa2Especialidade />}
            {state.etapa === "MEDICO" && <Etapa3Medico />}
            {state.etapa === "AGENDA" && <Etapa4Agenda />}
            {state.etapa === "PACIENTE" && <Etapa5Paciente />}
            {state.etapa === "CONFIRMACAO" && <Etapa6Confirmacao />}
            {state.etapa === "COMPROVANTE" && state.comprovante && (
              <div className="space-y-6">
                <Comprovante comprovante={state.comprovante} />
                <div className="flex justify-center">
                  <Button size="lg" onClick={() => dispatch({ type: "REINICIAR" })}>
                    Fazer novo agendamento
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AgendamentoPage() {
  return (
    <AgendamentoProvider>
      <AgendamentoConteudo />
    </AgendamentoProvider>
  );
}
