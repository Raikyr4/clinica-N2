import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";
import {
  FileText,
  Heart,
  Pill,
  AlertTriangle,
  Users,
  ClipboardList,
  Phone,
  User,
  Save,
  Eye,
} from "lucide-react";

export default function MedicalRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: record, isLoading } = useQuery({
    queryKey: ["patient-record"],
    queryFn: async () => {
      const { data } = await medicalRecordsApi.getMine();
      return data;
    },
  });


  const [isRecordVisible, setIsRecordVisible] = useState(false);

  const [form, setForm] = useState({
    queixas_principais: "",
    historico_medico: "",
    antecedentes_familiares: "",
    alergias: "",
    medicamentos_em_uso: "",
    observacoes_gerais: "",
    contato_emergencia_nome: "",
    contato_emergencia_telefone: "",
  });

  useEffect(() => {
    if (record) {
      setForm({
        queixas_principais: record.queixas_principais ?? "",
        historico_medico: record.historico_medico ?? "",
        antecedentes_familiares: record.antecedentes_familiares ?? "",
        alergias: record.alergias ?? "",
        medicamentos_em_uso: record.medicamentos_em_uso ?? "",
        observacoes_gerais: record.observacoes_gerais ?? "",
        contato_emergencia_nome: record.contato_emergencia_nome ?? "",
        contato_emergencia_telefone: record.contato_emergencia_telefone ?? "",
      });
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await medicalRecordsApi.updateMine({
        queixas_principais: form.queixas_principais,
        historico_medico: form.historico_medico || null,
        antecedentes_familiares: form.antecedentes_familiares || null,
        alergias: form.alergias || null,
        medicamentos_em_uso: form.medicamentos_em_uso || null,
        observacoes_gerais: form.observacoes_gerais || null,
        contato_emergencia_nome: form.contato_emergencia_nome,
        contato_emergencia_telefone: form.contato_emergencia_telefone,
      });
      return data;
    },
    onSuccess: async () => {
      toast.success("Prontuário atualizado com sucesso");
      await queryClient.invalidateQueries({ queryKey: ["patient-record"] });
    },
    onError: () => {
      toast.error("Não foi possível salvar. Tente novamente.");
    },
  });

  const profile = user?.patient_profile;

  const age = useMemo(() => {
    if (!profile?.data_nascimento) return null;
    try {
      return differenceInYears(new Date(), new Date(profile.data_nascimento));
    } catch {
      return null;
    }
  }, [profile?.data_nascimento]);

  const lastUpdated = useMemo(() => {
    const ref = record?.updated_at || record?.created_at;
    if (!ref) return null;
    try {
      return format(new Date(ref), "dd/MM/yyyy HH:mm");
    } catch {
      return null;
    }
  }, [record?.created_at, record?.updated_at]);

  const demographics = [
    { label: "Nome completo", value: user?.nome || "-" },
    { label: "Data de nascimento", value: profile?.data_nascimento ? format(new Date(profile.data_nascimento), "dd/MM/yyyy") : "-" },
    { label: "Telefone", value: profile?.telefone || "-" },
    { label: "Endereço", value: profile?.endereco || "-" },
    { label: "Sexo", value: profile?.sexo || "-" },
    { label: "Estado civil", value: profile?.estado_civil || "-" },
    { label: "Profissão", value: profile?.profissao || "-" },
    { label: "Convênio", value: profile?.convenio || "Particular" },
  ];

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const clinicalSections = [
    { key: "queixas_principais", label: "Queixa principal *", icon: ClipboardList, required: true },
    { key: "historico_medico", label: "Histórico médico", icon: Heart },
    { key: "antecedentes_familiares", label: "Antecedentes familiares", icon: Users },
    { key: "alergias", label: "Alergias", icon: AlertTriangle },
    { key: "medicamentos_em_uso", label: "Medicamentos em uso", icon: Pill },
    { key: "observacoes_gerais", label: "Observações gerais", icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`space-y-6 transition-all ${isRecordVisible ? "" : "pointer-events-none select-none blur-sm"}`}>
      {/* Header banner */}
      <section className="overflow-hidden rounded-lg border border-border/40 bg-primary p-6 text-primary-foreground shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-widest opacity-80">Prontuário digital</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Meu Prontuário</h1>
            <p className="max-w-md text-sm opacity-90">
              Mantenha seus dados clínicos atualizados para um atendimento mais assertivo.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-primary-foreground/15 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide opacity-70">Idade</p>
              <p className="text-lg font-bold">{age !== null ? `${age}` : "--"}</p>
            </div>
            <div className="rounded-xl bg-primary-foreground/15 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide opacity-70">Convênio</p>
              <p className="truncate text-sm font-bold">{profile?.convenio || "Part."}</p>
            </div>
            <div className="rounded-xl bg-primary-foreground/15 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wide opacity-70">Atualizado</p>
              <p className="text-sm font-bold">{lastUpdated?.split(" ")[0] || "--"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal data + Emergency contact */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/40 shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-4 w-4 text-primary" />
              Dados pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {demographics.map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-muted/20 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-4 w-4 text-destructive" />
              Contato de emergência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nome</p>
              <p className="mt-0.5 text-sm font-semibold">{form.contato_emergencia_nome || "Não informado"}</p>
            </div>
            <div className="rounded-xl bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Telefone</p>
              <p className="mt-0.5 text-sm font-semibold">{form.contato_emergencia_telefone || "Não informado"}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mantenha atualizado para situações de urgência.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clinical history */}
      <Card className="border-border/40 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-4 w-4 text-destructive" />
            Histórico clínico
          </CardTitle>
          <CardDescription>Informações que ajudam os médicos no seu atendimento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {clinicalSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.key} className="space-y-1.5">
                  <Label htmlFor={section.key} className="flex items-center gap-1.5 text-xs">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {section.label}
                  </Label>
                  <Textarea
                    id={section.key}
                    value={(form as any)[section.key]}
                    onChange={(e) => updateField(section.key, e.target.value)}
                    required={section.required}
                    className="min-h-[120px] rounded-xl border-border/60 bg-muted/30 text-sm"
                    placeholder={`Descreva ${section.label.toLowerCase().replace(" *", "")}...`}
                  />
                </div>
              );
            })}
          </div>

          {/* Emergency contact inputs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contato_emergencia_nome" className="text-xs">
                Contato de emergência - Nome *
              </Label>
              <Input
                id="contato_emergencia_nome"
                value={form.contato_emergencia_nome}
                onChange={(e) => updateField("contato_emergencia_nome", e.target.value)}
                required
                className="rounded-xl border-border/60 bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contato_emergencia_telefone" className="text-xs">
                Contato de emergência - Telefone *
              </Label>
              <Input
                id="contato_emergencia_telefone"
                value={form.contato_emergencia_telefone}
                onChange={(e) => updateField("contato_emergencia_telefone", e.target.value)}
                required
                className="rounded-xl border-border/60 bg-muted/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
            <p className="text-xs text-muted-foreground">Revise antes de salvar.</p>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {!isRecordVisible && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-border/60 shadow-elevated">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 w-fit">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Visualizar prontuário?</CardTitle>
              <CardDescription className="text-sm">
                Seus dados clínicos são sensíveis. Confirme para acessar.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center pb-6">
              <Button onClick={() => setIsRecordVisible(true)} className="sm:min-w-[140px]">
                Sim, visualizar
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="sm:min-w-[140px]">
                Não, voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
