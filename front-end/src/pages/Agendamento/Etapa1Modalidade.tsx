import { useQuery } from "@tanstack/react-query";
import { CreditCard, WalletCards } from "lucide-react";
import { useAgendamento } from "@/context/AgendamentoContext";
import { listarPlanos } from "@/services/planoService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function Etapa1Modalidade() {
  const { dispatch } = useAgendamento();
  const { data: planos = [] } = useQuery({ queryKey: ["planos"], queryFn: listarPlanos });
  const [planoSelecionado, setPlanoSelecionado] = useState("");

  const plano = planos.find((item) => String(item.codigo) === planoSelecionado);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" />
            Consulta particular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Agende uma consulta sem usar convenio ou plano de saude.</p>
          <Button size="lg" onClick={() => dispatch({ type: "SELECIONAR_MODALIDADE", modalidade: "P" })}>
            Agendar particular
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Consulta por convenio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={planoSelecionado} onValueChange={setPlanoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o plano" />
            </SelectTrigger>
            <SelectContent>
              {planos.map((item) => (
                <SelectItem key={item.codigo} value={String(item.codigo)}>
                  {item.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="lg"
            disabled={!plano}
            onClick={() =>
              dispatch({
                type: "SELECIONAR_MODALIDADE",
                modalidade: "C",
                codPlanoSaude: plano?.codigo,
                planoNome: plano?.nome,
              })
            }
          >
            Agendar por convenio
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
