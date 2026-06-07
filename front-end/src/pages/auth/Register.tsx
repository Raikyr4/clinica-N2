import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi, doctorBillingApi } from "@/api/endpoints";
import { UserRole } from "@/types/api";
import type { DoctorPlanOption } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  User,
} from "lucide-react";
import { z } from "zod";
import { handleAPIError, ERROR_MESSAGES } from "@/lib/error";
import { cn } from "@/lib/utils";
import { DoctorPlanCard } from "@/components/doctor/DoctorPlanCard";
import { formatDoctorPlanPrice, getHighlightedDoctorPlan } from "@/components/doctor/doctor-plan-utils";

const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10), 10)) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11), 10)) return false;
  return true;
};

const formatCPFDisplay = (cpf: string) => {
  const n = cpf.replace(/\D/g, "");
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
};

const baseSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no minimo 3 caracteres").trim(),
  email: z.string().email("Email invalido").trim().toLowerCase(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 digitos").refine(validarCPF, "CPF invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "As senhas nao coincidem", path: ["confirmPassword"] });

const patientPersonalSchema = z.object({
  dataNascimento: z.string().min(1, "Informe a data de nascimento"),
  telefone: z.string().min(8, "Telefone invalido"),
  endereco: z.string().min(5, "Informe o endereco"),
  sexo: z.string().min(1, "Informe o sexo"),
  estadoCivil: z.string().optional(),
  profissao: z.string().optional(),
  convenio: z.string().optional(),
});

const patientClinicalSchema = z.object({
  queixasPrincipais: z.string().min(10, "Descreva a queixa principal"),
  historicoMedico: z.string().optional(),
  antecedentesFamiliares: z.string().optional(),
  alergias: z.string().optional(),
  medicamentosEmUso: z.string().optional(),
  observacoesGerais: z.string().optional(),
  contatoEmergenciaNome: z.string().min(3, "Informe o nome"),
  contatoEmergenciaTelefone: z.string().min(8, "Informe o telefone"),
});

const doctorProfessionalSchema = z.object({
  crm: z.string()
    .regex(/^(CRM|CRO|CRP|CRN|CRF|COREN|CREFITO|CRFA)-?[A-Z]{2}\s?\d{3,10}$/i, "Use formato como CRM-SP 123456 ou CRO-RJ 98765"),
  especialidade: z.string().min(3, "Informe a especialidade"),
  telefone: z.string().min(8, "Telefone invalido"),
  bio: z.string().optional(),
  valorConsulta: z.string().optional(),
});

const doctorPaymentSchema = z.object({
  holderName: z.string().min(3, "Informe o nome do titular"),
  holderDocument: z.string().min(11, "CPF/CNPJ invalido"),
  cardNumber: z.string().min(13, "Numero de cartao invalido"),
  expMonth: z.string().min(1, "Mes invalido"),
  expYear: z.string().min(4, "Ano invalido"),
  cvv: z.string().min(3, "CVV invalido"),
});

type RoleType = "patient" | "doctor" | null;

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{label}</span>
          {i < steps.length - 1 && <div className="hidden h-px w-6 bg-border sm:block" />}
        </div>
      ))}
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-sm text-destructive">{error}</p>;
}

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forcedDoctorFlow = searchParams.get("role") === "doctor";
  const requestedPlanCode = searchParams.get("plan") ?? "";

  const [role, setRole] = useState<RoleType>(forcedDoctorFlow ? "doctor" : null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [didHydrateQueryPlan, setDidHydrateQueryPlan] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [sexo, setSexo] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [profissao, setProfissao] = useState("");
  const [convenio, setConvenio] = useState("");
  const [queixasPrincipais, setQueixasPrincipais] = useState("");
  const [historicoMedico, setHistoricoMedico] = useState("");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState("");
  const [alergias, setAlergias] = useState("");
  const [medicamentosEmUso, setMedicamentosEmUso] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  const [crm, setCrm] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [doctorTelefone, setDoctorTelefone] = useState("");
  const [bio, setBio] = useState("");
  const [valorConsulta, setValorConsulta] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");

  const patientSteps = ["Conta", "Dados pessoais", "Historico clinico"];
  const doctorSteps = ["Conta", "Dados profissionais", "Plano", "Pagamento"];
  const steps = role === "doctor" ? doctorSteps : patientSteps;
  const totalSteps = steps.length;
  const isDoctorFlow = role === "doctor";

  const { data: plans = [] } = useQuery<DoctorPlanOption[]>({
    queryKey: ["doctor-plans-public"],
    queryFn: async () => (await doctorBillingApi.plans()).data,
    enabled: isDoctorFlow || forcedDoctorFlow,
  });

  const highlightedPlan = getHighlightedDoctorPlan(plans);
  const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);

  useEffect(() => {
    if (!forcedDoctorFlow || didHydrateQueryPlan || plans.length === 0) return;
    if (requestedPlanCode && plans.some((plan) => plan.code === requestedPlanCode)) {
      setSelectedPlanCode(requestedPlanCode);
    }
    setDidHydrateQueryPlan(true);
  }, [forcedDoctorFlow, didHydrateQueryPlan, plans, requestedPlanCode]);

  const clearField = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateCurrentStep = () => {
    setErrors({});

    if (step === 0) {
      const result = baseSchema.safeParse({
        nome: nome.trim(),
        email: email.trim(),
        cpf: cpf.replace(/\D/g, ""),
        password,
        confirmPassword,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return true;
    }

    if (role === "patient" && step === 1) {
      const result = patientPersonalSchema.safeParse({
        dataNascimento,
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        sexo: sexo.trim(),
        estadoCivil: estadoCivil.trim() || undefined,
        profissao: profissao.trim() || undefined,
        convenio: convenio.trim() || undefined,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return true;
    }

    if (role === "patient" && step === 2) {
      const result = patientClinicalSchema.safeParse({
        queixasPrincipais: queixasPrincipais.trim(),
        historicoMedico: historicoMedico.trim() || undefined,
        antecedentesFamiliares: antecedentesFamiliares.trim() || undefined,
        alergias: alergias.trim() || undefined,
        medicamentosEmUso: medicamentosEmUso.trim() || undefined,
        observacoesGerais: observacoesGerais.trim() || undefined,
        contatoEmergenciaNome: contatoEmergenciaNome.trim(),
        contatoEmergenciaTelefone: contatoEmergenciaTelefone.trim(),
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return true;
    }

    if (role === "doctor" && step === 1) {
      const result = doctorProfessionalSchema.safeParse({
        crm: crm.trim(),
        especialidade: especialidade.trim(),
        telefone: doctorTelefone.trim(),
        bio: bio.trim() || undefined,
        valorConsulta: valorConsulta.trim() || undefined,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return true;
    }

    if (role === "doctor" && step === 2) {
      if (!selectedPlanCode) {
        setErrors({ selectedPlanCode: "Selecione um plano para continuar." });
        return false;
      }
      return true;
    }

    if (role === "doctor" && step === 3) {
      const result = doctorPaymentSchema.safeParse({
        holderName: holderName.trim(),
        holderDocument: holderDocument.trim(),
        cardNumber: cardNumber.replace(/\s/g, ""),
        expMonth: expMonth.trim(),
        expYear: expYear.trim(),
        cvv: cvv.trim(),
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return true;
    }

    return true;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (role === "patient") {
        return (await authApi.register({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf: cpf.replace(/\D/g, ""),
          password,
          role: UserRole.PACIENTE,
          patient_profile: {
            data_nascimento: dataNascimento,
            telefone: telefone.trim(),
            endereco: endereco.trim(),
            sexo: sexo.trim(),
            estado_civil: estadoCivil.trim() || undefined,
            profissao: profissao.trim() || undefined,
            convenio: convenio.trim() || undefined,
          },
          patient_record: {
            queixas_principais: queixasPrincipais.trim(),
            historico_medico: historicoMedico.trim() || undefined,
            antecedentes_familiares: antecedentesFamiliares.trim() || undefined,
            alergias: alergias.trim() || undefined,
            medicamentos_em_uso: medicamentosEmUso.trim() || undefined,
            observacoes_gerais: observacoesGerais.trim() || undefined,
            contato_emergencia_nome: contatoEmergenciaNome.trim(),
            contato_emergencia_telefone: contatoEmergenciaTelefone.trim(),
          },
        })).data;
      }

      return (await authApi.registerDoctorWithPlan({
        doctor: {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          cpf: cpf.replace(/\D/g, ""),
          password,
          role: UserRole.MEDICO,
          crm_crp: crm.trim(),
          especialidade: especialidade.trim(),
          bio: bio.trim() || undefined,
          valor_padrao_consulta: valorConsulta ? parseFloat(valorConsulta) : undefined,
        },
        plan_code: selectedPlanCode,
        payment: {
          holder_name: holderName.trim(),
          holder_document: holderDocument.trim(),
          card_number: cardNumber.replace(/\s/g, ""),
          exp_month: Number(expMonth),
          exp_year: Number(expYear),
          cvv: cvv.trim(),
        },
      })).data;
    },
    onSuccess: () => {
      toast.success("Cadastro realizado com sucesso! Faca login para continuar.");
      navigate("/login");
    },
    onError: (error: unknown) => {
      const errorInfo = handleAPIError(error);
      if (errorInfo.isConflict) {
        const message = errorInfo.message.toLowerCase();
        if (message.includes("email")) {
          setStep(0);
          setErrors({ email: errorInfo.message });
          toast.error("Este email ja esta cadastrado");
        } else if (message.includes("cpf")) {
          setStep(0);
          setErrors({ cpf: errorInfo.message });
          toast.error("Este CPF ja esta cadastrado");
        } else {
          toast.error(errorInfo.message);
        }
        return;
      }

      if (errorInfo.isValidation && Object.keys(errorInfo.fieldErrors).length > 0) {
        setErrors(errorInfo.fieldErrors);
        toast.error(ERROR_MESSAGES.VALIDATION);
        return;
      }

      toast.error(errorInfo.message);
    },
  });

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }
    registerMutation.mutate();
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      return;
    }
    if (forcedDoctorFlow) {
      navigate("/para-medicos/planos");
      return;
    }
    setRole(null);
  };

  const renderAccountStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo *</Label>
        <Input id="nome" placeholder="Joao da Silva" value={nome} onChange={(e) => { setNome(e.target.value); clearField("nome"); }} className={errors.nome ? "border-destructive" : ""} autoComplete="name" />
        <FieldError error={errors.nome} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); clearField("email"); }} className={errors.email ? "border-destructive" : ""} autoComplete="email" />
        <FieldError error={errors.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF *</Label>
        <Input id="cpf" placeholder="000.000.000-00" value={formatCPFDisplay(cpf)} onChange={(e) => { setCpf(e.target.value.replace(/\D/g, "").slice(0, 11)); clearField("cpf"); }} className={errors.cpf ? "border-destructive" : ""} />
        <FieldError error={errors.cpf} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); clearField("password"); }} className={cn("pr-10 hide-password-toggle", errors.password && "border-destructive")} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError error={errors.password} />
          <p className="text-xs text-muted-foreground">Minimo de 6 caracteres</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha *</Label>
          <div className="relative">
            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearField("confirmPassword"); }} className={cn("pr-10 hide-password-toggle", errors.confirmPassword && "border-destructive")} autoComplete="new-password" />
            <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground" aria-label={showConfirmPassword ? "Ocultar confirmacao de senha" : "Mostrar confirmacao de senha"}>
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError error={errors.confirmPassword} />
        </div>
      </div>
    </div>
  );

  const renderPatientPersonalStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de nascimento *</Label>
          <Input id="dataNascimento" type="date" value={dataNascimento} onChange={(e) => { setDataNascimento(e.target.value); clearField("dataNascimento"); }} className={errors.dataNascimento ? "border-destructive" : ""} />
          <FieldError error={errors.dataNascimento} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone *</Label>
          <Input id="telefone" placeholder="(62) 90000-0000" value={telefone} onChange={(e) => { setTelefone(e.target.value); clearField("telefone"); }} className={errors.telefone ? "border-destructive" : ""} />
          <FieldError error={errors.telefone} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereco *</Label>
        <Input id="endereco" placeholder="Rua, numero e complemento" value={endereco} onChange={(e) => { setEndereco(e.target.value); clearField("endereco"); }} className={errors.endereco ? "border-destructive" : ""} />
        <FieldError error={errors.endereco} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo *</Label>
          <Select value={sexo} onValueChange={(value) => { setSexo(value); clearField("sexo"); }}>
            <SelectTrigger className={errors.sexo ? "border-destructive" : ""}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <FieldError error={errors.sexo} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estadoCivil">Estado civil</Label>
          <Input id="estadoCivil" placeholder="Opcional" value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profissao">Profissao</Label>
          <Input id="profissao" placeholder="Opcional" value={profissao} onChange={(e) => setProfissao(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="convenio">Convenio</Label>
        <Input id="convenio" placeholder="Opcional" value={convenio} onChange={(e) => setConvenio(e.target.value)} />
      </div>
    </div>
  );

  const renderPatientClinicalStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="queixasPrincipais">Queixa principal *</Label>
        <Textarea id="queixasPrincipais" placeholder="Descreva o principal motivo da terapia" value={queixasPrincipais} onChange={(e) => { setQueixasPrincipais(e.target.value); clearField("queixasPrincipais"); }} className={errors.queixasPrincipais ? "border-destructive" : ""} />
        <FieldError error={errors.queixasPrincipais} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Historico medico</Label>
          <Textarea placeholder="Opcional" value={historicoMedico} onChange={(e) => setHistoricoMedico(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Antecedentes familiares</Label>
          <Textarea placeholder="Opcional" value={antecedentesFamiliares} onChange={(e) => setAntecedentesFamiliares(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Alergias</Label>
          <Textarea placeholder="Opcional" value={alergias} onChange={(e) => setAlergias(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Medicamentos em uso</Label>
          <Textarea placeholder="Opcional" value={medicamentosEmUso} onChange={(e) => setMedicamentosEmUso(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observacoes adicionais</Label>
        <Textarea placeholder="Opcional" value={observacoesGerais} onChange={(e) => setObservacoesGerais(e.target.value)} />
      </div>
      <div className="border-t pt-3">
        <p className="mb-3 text-sm font-semibold">Contato de emergencia</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome completo *</Label>
            <Input value={contatoEmergenciaNome} onChange={(e) => { setContatoEmergenciaNome(e.target.value); clearField("contatoEmergenciaNome"); }} className={errors.contatoEmergenciaNome ? "border-destructive" : ""} />
            <FieldError error={errors.contatoEmergenciaNome} />
          </div>
          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input value={contatoEmergenciaTelefone} onChange={(e) => { setContatoEmergenciaTelefone(e.target.value); clearField("contatoEmergenciaTelefone"); }} className={errors.contatoEmergenciaTelefone ? "border-destructive" : ""} />
            <FieldError error={errors.contatoEmergenciaTelefone} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDoctorProfessionalStep = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Monte a base do seu perfil profissional</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Essas informacoes serao usadas para apresentar voce na plataforma e preparar sua operacao inicial.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="crm">CRM/CRP *</Label>
          <Input id="crm" placeholder="CRM-SP 123456 ou CRO-RJ 98765" value={crm}
            onChange={(e) => { setCrm(e.target.value); clearField("crm"); }}
            className={errors.crm ? "border-destructive" : ""} />
          <FieldError error={errors.crm} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="especialidade">Especialidade *</Label>
          <Input id="especialidade" placeholder="Psicologia, Psiquiatria..." value={especialidade} onChange={(e) => { setEspecialidade(e.target.value); clearField("especialidade"); }} className={errors.especialidade ? "border-destructive" : ""} />
          <FieldError error={errors.especialidade} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doctorTelefone">Telefone *</Label>
          <Input id="doctorTelefone" placeholder="(62) 90000-0000" value={doctorTelefone} onChange={(e) => { setDoctorTelefone(e.target.value); clearField("telefone"); }} className={errors.telefone ? "border-destructive" : ""} />
          <FieldError error={errors.telefone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valorConsulta">Valor da consulta (R$)</Label>
          <Input id="valorConsulta" type="number" placeholder="150.00" value={valorConsulta} onChange={(e) => setValorConsulta(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio / Sobre voce</Label>
        <Textarea id="bio" placeholder="Conte um pouco sobre sua formacao e abordagem" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
      </div>
    </div>
  );

  const renderDoctorPlanStep = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Escolha o plano que melhor combina com seu momento.</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Voce pode manter o plano sugerido pela landing ou trocar antes de seguir para o pagamento.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <DoctorPlanCard
            key={plan.code}
            plan={plan}
            index={index}
            mode="selection"
            highlighted={highlightedPlan?.code === plan.code}
            selected={selectedPlanCode === plan.code}
            onSelect={() => {
              setSelectedPlanCode(plan.code);
              clearField("selectedPlanCode");
            }}
          />
        ))}
      </div>
      <FieldError error={errors.selectedPlanCode} />
    </div>
  );

  const renderDoctorPaymentStep = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Resumo da assinatura</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">O cadastro do medico e a ativacao do plano acontecem juntos ao confirmar o pagamento.</p>
          </div>
          <CreditCard className="h-5 w-5 text-secondary" />
        </div>
        <div className="mt-4 rounded-2xl border border-border/50 bg-background/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedPlan?.name || "Plano nao selecionado"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedPlan?.description || "Volte ao passo anterior para escolher um plano."}</p>
            </div>
            {selectedPlan && <Badge variant="secondary">{formatDoctorPlanPrice(selectedPlan.price_monthly)}/mes</Badge>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Titular *</Label>
          <Input value={holderName} onChange={(e) => { setHolderName(e.target.value); clearField("holderName"); }} className={errors.holderName ? "border-destructive" : ""} />
          <FieldError error={errors.holderName} />
        </div>
        <div className="space-y-2">
          <Label>CPF/CNPJ *</Label>
          <Input value={holderDocument} onChange={(e) => { setHolderDocument(e.target.value); clearField("holderDocument"); }} className={errors.holderDocument ? "border-destructive" : ""} />
          <FieldError error={errors.holderDocument} />
        </div>
        <div className="space-y-2">
          <Label>Numero do cartao *</Label>
          <Input value={cardNumber} onChange={(e) => { setCardNumber(e.target.value); clearField("cardNumber"); }} className={errors.cardNumber ? "border-destructive" : ""} />
          <FieldError error={errors.cardNumber} />
        </div>
        <div className="space-y-2">
          <Label>Mes *</Label>
          <Input value={expMonth} onChange={(e) => { setExpMonth(e.target.value); clearField("expMonth"); }} className={errors.expMonth ? "border-destructive" : ""} />
          <FieldError error={errors.expMonth} />
        </div>
        <div className="space-y-2">
          <Label>Ano *</Label>
          <Input value={expYear} onChange={(e) => { setExpYear(e.target.value); clearField("expYear"); }} className={errors.expYear ? "border-destructive" : ""} />
          <FieldError error={errors.expYear} />
        </div>
        <div className="space-y-2">
          <Label>CVV *</Label>
          <Input value={cvv} onChange={(e) => { setCvv(e.target.value); clearField("cvv"); }} className={errors.cvv ? "border-destructive" : ""} />
          <FieldError error={errors.cvv} />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (step === 0) return renderAccountStep();
    if (role === "patient" && step === 1) return renderPatientPersonalStep();
    if (role === "patient" && step === 2) return renderPatientClinicalStep();
    if (role === "doctor" && step === 1) return renderDoctorProfessionalStep();
    if (role === "doctor" && step === 2) return renderDoctorPlanStep();
    if (role === "doctor" && step === 3) return renderDoctorPaymentStep();
    return null;
  };

  const isLastStep = step === totalSteps - 1;

  if (!role) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
          <Card className="w-full max-w-xl shadow-elevated">
            <CardHeader className="pb-4 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-secondary p-3">
                  <Activity className="h-8 w-8 text-secondary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
              <CardDescription>Selecione o tipo de conta que deseja criar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button type="button" onClick={() => { setRole("patient"); setStep(0); }} className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
                <div className="rounded-full bg-primary/10 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Sou Paciente</p>
                  <p className="text-sm text-muted-foreground">Agende consultas e gerencie seu prontuario</p>
                </div>
              </button>
              <button type="button" onClick={() => { setRole("doctor"); setStep(0); }} className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
                <div className="rounded-full bg-primary/10 p-3">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Sou Medico</p>
                  <p className="text-sm text-muted-foreground">Gerencie sua agenda, assinatura e operacao com mais controle.</p>
                </div>
              </button>
              <div className="pt-2 text-center text-sm">
                <span className="text-muted-foreground">Ja tem uma conta? </span>
                <Link to="/login" className="font-medium text-primary hover:underline">Fazer login</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
            <section className="overflow-hidden rounded-[20px] border border-border/50 bg-gradient-to-r from-primary via-primary/95 to-primary/85 p-4 text-primary-foreground shadow-elevated sm:p-5">
              <div className="flex flex-col gap-3">
                <Badge className="w-fit border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15">
                  {isDoctorFlow ? "Cadastro medico" : "Cadastro paciente"}
                </Badge>
                <StepIndicator steps={steps} current={step} />
              </div>
            </section>

            <Card className="border-border/50 shadow-elevated">
              <CardHeader className="border-b border-border/50 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">{steps[step]}</CardTitle>
                    <CardDescription className="mt-0.5">
                      {isDoctorFlow ? "Fluxo guiado para cadastro, plano e assinatura do medico." : "Preencha as informacoes necessarias para concluir seu cadastro."}
                    </CardDescription>
                  </div>
                  {isDoctorFlow && selectedPlan && (
                    <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">{selectedPlan.name}</p>
                      <p className="text-muted-foreground">{formatDoctorPlanPrice(selectedPlan.price_monthly)}/mes</p>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5">
                <div className="min-h-[260px]">{renderCurrentStep()}</div>

                <div className="mt-6 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" variant="outline" onClick={goBack}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {step === 0 ? "Voltar" : "Anterior"}
                  </Button>

                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <div className="text-xs text-muted-foreground">
                      {isDoctorFlow && isLastStep ? "Ao confirmar, voce assina o plano e conclui o cadastro." : "Seus dados ficam preservados ao avancar e voltar."}
                    </div>
                    <Button type="button" onClick={nextStep} disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : isLastStep ? (
                        <>
                          {isDoctorFlow ? "Assinar e cadastrar" : "Cadastrar"}
                          <Check className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Proximo
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">Ja tem uma conta? </span>
                  <Link to="/login" className="font-medium text-primary hover:underline">Fazer login</Link>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}
