import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ModalCadastro } from "@/components/ModalCadastro";
import { PacienteCard } from "@/components/PacienteCard";
import { buscarPacientes } from "@/services/pacienteService";
import { incluirListaEspera } from "@/services/listaEsperaService";
import { getErrorMessage } from "@/services/http";
import type { Paciente } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type Etapa = "BUSCAR" | "CONFIRMAR" | "COMPROVANTE";

export default function ListaEsperaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const crmMedico = Number(searchParams.get("crmMedico") ?? 0);
  const codEspecialidade = Number(searchParams.get("codEspecialidade") ?? 0);
  const medicoNome = searchParams.get("medicoNome") ?? "Qualquer médico";
  const espNome = searchParams.get("espNome") ?? "Especialidade";
  const semPreferencia = searchParams.get("semPreferencia") === "true";

  const [etapa, setEtapa] = useState<Etapa>("BUSCAR");
  const [nome, setNome] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [posicaoFila, setPosicaoFila] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const buscarMutation = useMutation({
    mutationFn: () => buscarPacientes(nome, nomeMae),
    onSuccess: (data) => {
      setPacientes(data);
      if (data.length === 0) {
        toast({
          title: "Paciente não encontrado",
          description: "Verifique o nome ou cadastre um novo paciente.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na busca",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const incluirMutation = useMutation({
    mutationFn: () =>
      incluirListaEspera(
        pacienteSelecionado!.codigo,
        crmMedico,
        codEspecialidade,
      ),
    onSuccess: ({ posicaoFila }) => {
      setPosicaoFila(posicaoFila);
      setEtapa("COMPROVANTE");
    },
    onError: (error) => {
      toast({
        title: "Erro ao incluir na lista",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const selecionarPaciente = (p: Paciente) => {
    setPacienteSelecionado(p);
    setEtapa("CONFIRMAR");
  };

  const onPacienteCriado = (p: Paciente) => {
    setPacienteSelecionado(p);
    setModalAberto(false);
    setEtapa("CONFIRMAR");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/70 to-background px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="rounded-md border bg-card p-5 shadow-card">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-semibold uppercase text-primary">Clínica SafeCare</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Lista de espera</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Caso de uso CSU-LE — Incluir Paciente em Lista de Espera
              </p>
            </div>
          </div>
        </header>

        {/* Consulta info card */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-xs uppercase text-muted-foreground">Especialidade</span>
              <p className="font-semibold">{espNome}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Médico</span>
              <p className="font-semibold">{semPreferencia ? "Sem preferência (qualquer médico)" : medicoNome}</p>
            </div>
            <div className="sm:col-span-2">
              <div className="mt-1 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-700 text-xs">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Você será avisado assim que surgir um horário disponível.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapa: Buscar paciente */}
        {etapa === "BUSCAR" && (
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Identificar o paciente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Informe o nome do paciente e o nome da mãe para localizá-lo no sistema.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <Card>
                <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="nomePaciente">Nome do paciente</Label>
                    <Input
                      id="nomePaciente"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex.: Ana Silva"
                      onKeyDown={(e) => e.key === "Enter" && nome && nomeMae && buscarMutation.mutate()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeMae">Nome da mãe</Label>
                    <Input
                      id="nomeMae"
                      value={nomeMae}
                      onChange={(e) => setNomeMae(e.target.value)}
                      placeholder="Confirma a identificação"
                      onKeyDown={(e) => e.key === "Enter" && nome && nomeMae && buscarMutation.mutate()}
                    />
                  </div>
                  <Button
                    disabled={!nome || !nomeMae || buscarMutation.isPending}
                    onClick={() => buscarMutation.mutate()}
                  >
                    {buscarMutation.isPending
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Search className="mr-2 h-4 w-4" />}
                    Buscar
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  Paciente ainda não cadastrado na clínica?
                </p>
                <Button variant="outline" size="sm" onClick={() => setModalAberto(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar novo paciente
                </Button>
              </div>

              {pacientes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {pacientes.length} paciente(s) encontrado(s) — selecione o correto:
                    </p>
                    {pacientes.map((p) => (
                      <PacienteCard key={p.codigo} paciente={p} onSelecionar={selecionarPaciente} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Etapa: Confirmar */}
        {etapa === "CONFIRMAR" && pacienteSelecionado && (
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Confirmar inclusão na lista de espera
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Revise os dados antes de confirmar.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Resumo label="Paciente" value={pacienteSelecionado.nome} />
                <Resumo label="Código" value={String(pacienteSelecionado.codigo)} />
                <Resumo label="Nascimento" value={new Date(`${pacienteSelecionado.dataNasc}T00:00:00`).toLocaleDateString("pt-BR")} />
                <Resumo label="Telefone" value={pacienteSelecionado.telefone} />
                <Resumo label="Especialidade" value={espNome} />
                <Resumo label="Médico" value={semPreferencia ? "Sem preferência" : medicoNome} />
              </div>
              <Separator />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setEtapa("BUSCAR")}>
                  Corrigir paciente
                </Button>
                <Button
                  size="lg"
                  disabled={incluirMutation.isPending}
                  onClick={() => incluirMutation.mutate()}
                >
                  {incluirMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar lista de espera
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa: Comprovante */}
        {etapa === "COMPROVANTE" && pacienteSelecionado && posicaoFila !== null && (
          <Card className="shadow-elevated border-emerald-200">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl text-emerald-700">
                Incluído na lista de espera com sucesso!
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                O paciente será contactado quando surgir uma vaga.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-sm">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-xs uppercase text-emerald-600 font-sans mb-1">Posição na fila</p>
                <p className="text-5xl font-bold text-emerald-700">{posicaoFila}º</p>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2 font-sans">
                <Resumo label="Paciente" value={pacienteSelecionado.nome} />
                <Resumo label="Código" value={String(pacienteSelecionado.codigo)} />
                <Resumo label="Especialidade" value={espNome} />
                <Resumo label="Médico" value={semPreferencia ? "Sem preferência" : medicoNome} />
                <Resumo label="Telefone de contato" value={pacienteSelecionado.telefone} />
                <Resumo label="Status" value="Na fila de espera" />
              </div>
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" onClick={() => navigate("/agendamento")}>
                  Novo agendamento
                </Button>
                <Button onClick={() => navigate("/")}>
                  Voltar ao início
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ModalCadastro
        open={modalAberto}
        onOpenChange={setModalAberto}
        onPacienteCriado={onPacienteCriado}
      />
    </main>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
