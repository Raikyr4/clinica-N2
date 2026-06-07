import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Stethoscope } from "lucide-react";
import { useAgendamento } from "@/context/AgendamentoContext";
import { listarEspecialidades } from "@/services/especialidadeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function Etapa2Especialidade() {
  const { state, dispatch } = useAgendamento();
  const { data = [], isLoading } = useQuery({
    queryKey: ["especialidades", state.modalidade, state.codPlanoSaude],
    queryFn: () => listarEspecialidades(state.modalidade!, state.codPlanoSaude),
    enabled: Boolean(state.modalidade),
  });

  if (isLoading) return <LoadingSpinner label="Carregando especialidades..." />;

  if (data.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-600" />
          <h3 className="text-xl font-semibold text-amber-900">Nenhuma especialidade encontrada</h3>
          <p className="max-w-xl text-sm text-amber-800">
            Nao existem especialidades disponiveis para a modalidade selecionada. Volte e escolha outra modalidade ou plano.
          </p>
          <Button variant="outline" onClick={() => dispatch({ type: "VOLTAR" })}>
            Voltar para modalidade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((especialidade) => (
        <Card key={especialidade.codigo} className="shadow-card transition hover:border-primary">
          <CardContent className="flex min-h-36 flex-col justify-between gap-4 p-5">
            <div>
              <Stethoscope className="mb-3 h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{especialidade.nome}</h3>
            </div>
            <Button
              onClick={() =>
                dispatch({
                  type: "SELECIONAR_ESPECIALIDADE",
                  codigo: especialidade.codigo,
                  nome: especialidade.nome,
                })
              }
            >
              Escolher especialidade
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
