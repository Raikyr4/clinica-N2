import { useMutation } from "@tanstack/react-query";
import { Loader2, Search, UserPlus } from "lucide-react";
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

  const mutation = useMutation({
    mutationFn: () => buscarPacientes(nome, nomeMae),
    onError: (error) => toast({ title: "Paciente nao encontrado", description: getErrorMessage(error), variant: "destructive" }),
  });

  const selecionarPaciente = (paciente: Paciente) => dispatch({ type: "SELECIONAR_PACIENTE", paciente });

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

      <div className="space-y-3">
        {(mutation.data ?? []).map((paciente) => (
          <PacienteCard key={paciente.codigo} paciente={paciente} onSelecionar={selecionarPaciente} />
        ))}
      </div>

      <ModalCadastro open={modalAberto} onOpenChange={setModalAberto} onPacienteCriado={selecionarPaciente} />
    </section>
  );
}
