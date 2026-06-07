import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAgendamento } from "@/context/AgendamentoContext";
import { ModalCadastro } from "@/components/ModalCadastro";
import { PacienteCard } from "@/components/PacienteCard";
import { buscarPacientes } from "@/services/pacienteService";
import { getErrorMessage } from "@/services/http";
import { Paciente } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function Etapa5Paciente() {
  const { dispatch } = useAgendamento();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [pacienteNaoEncontrado, setPacienteNaoEncontrado] = useState(false);

  const mutation = useMutation({
    mutationFn: () => buscarPacientes(nome, nomeMae),
    onSuccess: (data) => {
      setPacienteNaoEncontrado(data.length === 0);
    },
    onError: (error) => {
      setPacienteNaoEncontrado(true);
      toast({ title: "Paciente nao encontrado", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const selecionarPaciente = (paciente: Paciente) => dispatch({ type: "SELECIONAR_PACIENTE", paciente });
  const corrigirBusca = () => {
    setPacienteNaoEncontrado(false);
    setNome("");
    setNomeMae("");
  };

  return (
    <section className="space-y-5">
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="nomePaciente">Nome do paciente</Label>
            <Input id="nomePaciente" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Ana Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nomeMaePaciente">Nome da mae</Label>
            <Input id="nomeMaePaciente" value={nomeMae} onChange={(event) => setNomeMae(event.target.value)} placeholder="Confere a identificacao" />
          </div>
          <Button disabled={!nome || !nomeMae || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Buscar
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <p className="text-sm text-muted-foreground">Use nome e nome da mae para evitar selecionar o paciente errado.</p>
        <Button variant="outline" onClick={() => setModalAberto(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      {pacienteNaoEncontrado && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Paciente nao encontrado</h3>
                <p className="text-sm text-amber-800">
                  Se este for o primeiro agendamento do paciente na clinica, cadastre o paciente.
                  Caso contrario, corrija nome e nome da mae para buscar novamente.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={corrigirBusca}>
                Corrigir nome
              </Button>
              <Button onClick={() => setModalAberto(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Primeira consulta - cadastrar paciente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(mutation.data ?? []).map((paciente) => (
          <PacienteCard key={paciente.codigo} paciente={paciente} onSelecionar={selecionarPaciente} />
        ))}
      </div>

      <ModalCadastro open={modalAberto} onOpenChange={setModalAberto} onPacienteCriado={selecionarPaciente} />
    </section>
  );
}
