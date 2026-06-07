import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cadastrarPaciente } from "@/services/pacienteService";
import { listarPlanos } from "@/services/planoService";
import { getErrorMessage } from "@/services/http";
import { CadastrarPacienteRequest, Paciente } from "@/types/Clinica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const pacienteSchema = z
  .object({
    nome: z.string().min(3, "Informe o nome completo."),
    nomeMae: z.string().min(3, "Informe o nome da mae."),
    dataNasc: z.string().min(10, "Informe a data de nascimento."),
    sexo: z.enum(["F", "M"]),
    endereco: z.string().min(5, "Informe o endereco."),
    telefone: z.string().min(10, "Informe o telefone."),
    email: z.string().email("E-mail invalido.").optional().or(z.literal("")),
    cpf: z.string().optional(),
    nomeResponsavel: z.string().optional(),
    grauParentesco: z.string().optional(),
    telefoneResponsavel: z.string().optional(),
    codPlanoSaude: z.string().optional(),
    numeroCarteirinha: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const nascimento = new Date(`${value.dataNasc}T00:00:00`);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aniversarioPassou =
      hoje.getMonth() > nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
    if (!aniversarioPassou) idade -= 1;

    if (idade >= 18 && !value.cpf?.match(/^\d{11}$/)) {
      ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF com 11 numeros e obrigatorio para maior de idade." });
    }

    if (idade < 18) {
      if (!value.nomeResponsavel) {
        ctx.addIssue({ code: "custom", path: ["nomeResponsavel"], message: "Informe o responsavel." });
      }
      if (!value.grauParentesco) {
        ctx.addIssue({ code: "custom", path: ["grauParentesco"], message: "Informe o grau de parentesco." });
      }
      if (!value.telefoneResponsavel?.match(/^\d{10,11}$/)) {
        ctx.addIssue({ code: "custom", path: ["telefoneResponsavel"], message: "Telefone do responsavel obrigatorio." });
      }
    }
  });

type PacienteFormValues = z.infer<typeof pacienteSchema>;

export function CadastrarPacienteForm({ onPacienteCriado }: { onPacienteCriado?: (paciente: Paciente) => void }) {
  const { toast } = useToast();
  const { data: planos = [] } = useQuery({ queryKey: ["planos"], queryFn: listarPlanos });
  const form = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nome: "",
      nomeMae: "",
      dataNasc: "",
      sexo: "F",
      endereco: "",
      telefone: "",
      email: "",
      cpf: "",
      nomeResponsavel: "",
      grauParentesco: "",
      telefoneResponsavel: "",
      codPlanoSaude: "",
      numeroCarteirinha: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PacienteFormValues) => {
      const request: CadastrarPacienteRequest = {
        ...values,
        codPlanoSaude: values.codPlanoSaude ? Number(values.codPlanoSaude) : null,
      };
      return cadastrarPaciente(request);
    },
    onSuccess: (paciente) => {
      toast({ title: "Paciente cadastrado", description: "Agora ele pode ser usado no agendamento." });
      onPacienteCriado?.(paciente);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Cadastro nao concluido", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <Campo name="nome" label="Nome completo" form={form} />
          <Campo name="nomeMae" label="Nome da mae" form={form} />
          <Campo name="dataNasc" label="Data de nascimento" form={form} type="date" />
          <FormField
            control={form.control}
            name="sexo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Campo name="endereco" label="Endereco" form={form} />
          <Campo name="telefone" label="Telefone" form={form} inputMode="numeric" />
          <Campo name="email" label="E-mail" form={form} />
          <Campo name="cpf" label="CPF" form={form} inputMode="numeric" maxLength={11} />
          <Campo name="nomeResponsavel" label="Responsavel (se menor)" form={form} />
          <Campo name="grauParentesco" label="Grau de parentesco" form={form} />
          <Campo name="telefoneResponsavel" label="Telefone do responsavel" form={form} inputMode="numeric" />
          <FormField
            control={form.control}
            name="codPlanoSaude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de saude</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem plano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.codigo} value={String(plano.codigo)}>
                        {plano.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Campo name="numeroCarteirinha" label="Carteirinha do plano" form={form} />
        </div>

        <Button className="justify-self-end" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar paciente
        </Button>
      </form>
    </Form>
  );
}

function Campo({
  name,
  label,
  form,
  ...props
}: {
  name: keyof PacienteFormValues;
  label: string;
  form: ReturnType<typeof useForm<PacienteFormValues>>;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...props} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function CadastrarPacientePage() {
  return (
    <main className="min-h-screen bg-accent/40 px-4 py-8">
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Cadastrar paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <CadastrarPacienteForm />
        </CardContent>
      </Card>
    </main>
  );
}
