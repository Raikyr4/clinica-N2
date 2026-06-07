import { useQuery } from "@tanstack/react-query";
import { AlertCircle, UserRound, UsersRound } from "lucide-react";
import { useAgendamento } from "@/context/AgendamentoContext";
import { listarMedicos } from "@/services/medicoService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function Etapa3Medico() {
  const { state, dispatch } = useAgendamento();
  const { data = [], isLoading } = useQuery({
    queryKey: ["medicos", state.modalidade, state.codEspecialidade, state.codPlanoSaude],
    queryFn: () => listarMedicos(state.modalidade!, state.codEspecialidade!, state.codPlanoSaude),
    enabled: Boolean(state.modalidade && state.codEspecialidade),
  });

  if (isLoading) return <LoadingSpinner label="Buscando medicos..." />;

  if (data.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-600" />
          <h3 className="text-xl font-semibold text-amber-900">Nao ha medicos para esses criterios</h3>
          <p className="max-w-xl text-sm text-amber-800">
            Nao foram encontrados medicos que atendem a especialidade, modalidade e plano selecionados.
            Volte para alterar os dados do agendamento.
          </p>
          <Button variant="outline" onClick={() => dispatch({ type: "VOLTAR" })}>
            Voltar para especialidade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <UsersRound className="h-5 w-5 text-primary" />
              Sem preferencia por medico
            </h3>
            <p className="text-sm text-muted-foreground">O sistema mostrara os primeiros horarios disponiveis.</p>
          </div>
          <Button
            onClick={() =>
              dispatch({
                type: "SELECIONAR_MEDICO",
                crm: null,
                semPreferencia: true,
              })
            }
          >
            Ver horarios disponiveis
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((medico) => (
          <Card key={medico.crm} className="shadow-card">
            <CardContent className="flex flex-col gap-4 p-5">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <UserRound className="h-5 w-5 text-primary" />
                  {medico.nome}
                </h3>
                <p className="text-sm text-muted-foreground">CRM {medico.crm}</p>
                {medico.email && <p className="text-sm text-muted-foreground">{medico.email}</p>}
              </div>
              <Button
                onClick={() =>
                  dispatch({
                    type: "SELECIONAR_MEDICO",
                    crm: medico.crm,
                    nome: medico.nome,
                    semPreferencia: false,
                  })
                }
              >
                Escolher medico
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
