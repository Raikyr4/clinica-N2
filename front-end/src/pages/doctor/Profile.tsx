import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorBillingApi, profilesApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/auth";
import type { DoctorCurrentSubscription, DoctorPaymentMethod, DoctorPlanOption, DoctorProfile } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { DoctorPlanCard } from "@/components/doctor/DoctorPlanCard";
import { formatDoctorPlanPrice, getHighlightedDoctorPlan } from "@/components/doctor/doctor-plan-utils";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";
import {
  Briefcase, CreditCard, Mail, NotebookPen, Stethoscope,
  User as UserIcon, Shield, Bell, DollarSign, Landmark,
  Plus, Trash2, Building2, Wallet, Pencil, X, Check,
  Crown, ArrowRight, Sparkles,
} from "lucide-react";

type BankAccountType = "corrente" | "poupanca" | "pagamento";

interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: BankAccountType;
  titularNome: string;
  titularCpfCnpj: string;
  pixKey?: string;
  isDefault: boolean;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  corrente: "Conta Corrente",
  poupanca: "Conta Poupanca",
  pagamento: "Conta Pagamento",
};

export default function DoctorProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [valorPadraoInput, setValorPadraoInput] = useState("");
  const [activeTab, setActiveTab] = useState("dados");
  const [selectedPlan, setSelectedPlan] = useState("");

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    banco: "", agencia: "", conta: "", tipo: "corrente" as BankAccountType,
    titularNome: "", titularCpfCnpj: "", pixKey: "",
  });

  // Payment method states
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({
    holder_name: "", holder_document: "", card_number: "", exp_month: "", exp_year: "", cvv: "",
  });

  const resetCardForm = () => {
    setCardForm({ holder_name: "", holder_document: "", card_number: "", exp_month: "", exp_year: "", cvv: "" });
    setIsAddingPayment(false);
    setEditingPaymentId(null);
  };

  const { data: doctorProfile, isLoading, error } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile"],
    queryFn: async () => (await profilesApi.getDoctorMe()).data,
    retry: false,
  });

  const { data: plans = [] } = useQuery<DoctorPlanOption[]>({
    queryKey: ["doctor-plans-public"],
    queryFn: async () => (await doctorBillingApi.plans()).data,
  });
  const highlightedPlan = getHighlightedDoctorPlan(plans);

  const { data: subscription } = useQuery<DoctorCurrentSubscription>({
    queryKey: ["doctor-subscription"],
    queryFn: async () => (await doctorBillingApi.subscription()).data,
  });

  const { data: paymentMethods = [] } = useQuery<DoctorPaymentMethod[]>({
    queryKey: ["doctor-payment-methods"],
    queryFn: async () => (await doctorBillingApi.paymentMethods()).data,
  });

  useEffect(() => { if (error) toast.error(getApiErrorMessage(error, "Nao foi possivel carregar seu perfil profissional.")); }, [error]);

  useEffect(() => {
    if (doctorProfile?.valor_padrao_consulta !== undefined && doctorProfile.valor_padrao_consulta !== null) {
      setValorPadraoInput(String(Number(doctorProfile.valor_padrao_consulta)));
    } else { setValorPadraoInput(""); }
  }, [doctorProfile]);

  useEffect(() => {
    if (subscription?.plan?.code) setSelectedPlan(subscription.plan.code);
  }, [subscription]);

  const { mutate: updateDefaultValue, isPending: isSavingDefaultValue } = useMutation({
    mutationFn: async (valor: number) => (await profilesApi.updateDoctorMe({ valor_padrao_consulta: valor })).data,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["doctor-profile"], updatedProfile);
      setValorPadraoInput(String(Number(updatedProfile.valor_padrao_consulta ?? 0)));
      toast.success("Valor padrao atualizado com sucesso!");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e, "Nao foi possivel atualizar.")),
  });

  const { mutate: changePlan, isPending: isChangingPlan } = useMutation({
    mutationFn: async () => (await doctorBillingApi.changePlan(selectedPlan)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["doctor-subscription"] }); toast.success("Plano atualizado com sucesso."); },
    onError: () => toast.error("Nao foi possivel atualizar o plano."),
  });

  const { mutate: addPaymentMethod, isPending: isAddingPaymentMethod } = useMutation({
    mutationFn: async () => (await doctorBillingApi.addPaymentMethod({
      ...cardForm, exp_month: Number(cardForm.exp_month), exp_year: Number(cardForm.exp_year),
    })).data,
    onSuccess: () => {
      resetCardForm();
      queryClient.invalidateQueries({ queryKey: ["doctor-payment-methods"] });
      toast.success("Metodo de pagamento cadastrado.");
    },
    onError: () => toast.error("Falha ao cadastrar metodo de pagamento."),
  });

  const handleSubmitDefaultValue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = valorPadraoInput.replace(",", ".").trim();
    const valor = Number(normalized);
    if (!normalized || Number.isNaN(valor)) { toast.error("Informe um valor valido."); return; }
    if (valor <= 0) { toast.error("O valor deve ser maior que zero."); return; }
    updateDefaultValue(valor);
  };

  const handleAddBank = () => {
    if (!bankForm.banco.trim() || !bankForm.agencia.trim() || !bankForm.conta.trim() || !bankForm.titularNome.trim() || !bankForm.titularCpfCnpj.trim()) {
      toast.error("Preencha todos os campos obrigatorios."); return;
    }
    const newAccount: BankAccount = { id: Date.now().toString(), ...bankForm, isDefault: bankAccounts.length === 0 };
    setBankAccounts((prev) => [...prev, newAccount]);
    setBankForm({ banco: "", agencia: "", conta: "", tipo: "corrente", titularNome: "", titularCpfCnpj: "", pixKey: "" });
    setIsAddingBank(false);
    toast.success("Conta bancaria adicionada!");
  };

  const handleRemoveBank = (id: string) => {
    setBankAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length > 0 && !next.some((a) => a.isDefault)) next[0].isDefault = true;
      return next;
    });
    toast.success("Conta removida.");
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const handleEditPayment = (method: DoctorPaymentMethod) => {
    setEditingPaymentId(method.id);
    setCardForm({
      holder_name: method.holder_name, holder_document: "", card_number: `•••• •••• •••• ${method.last4}`,
      exp_month: String(method.exp_month), exp_year: String(method.exp_year), cvv: "",
    });
    setIsAddingPayment(true);
  };

  const getInitials = (name: string) => name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

  if (!user) return null;

  const valorPadraoAtual = Number(doctorProfile?.valor_padrao_consulta ?? 0);
  const currentPlan = subscription?.plan;

  return (
    <div className="space-y-4">
      <Card className="shadow-card border-border/60 overflow-hidden">
        <div className="bg-primary p-4 sm:p-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Avatar className="h-14 w-14 border-2 border-primary-foreground/20 sm:h-16 sm:w-16">
              <AvatarFallback className="bg-primary-foreground/20 text-lg text-primary-foreground">{getInitials(user.nome)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-primary-foreground">{user.nome}</h2>
              <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge className="border-0 bg-primary-foreground/20 text-xs text-primary-foreground"><Stethoscope className="mr-1 h-3 w-3" /> Medico</Badge>
                {doctorProfile?.especialidade && (
                  <Badge className="border-0 bg-primary-foreground/20 text-xs text-primary-foreground">{doctorProfile.especialidade}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados" className="gap-1.5 text-xs sm:text-sm">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Informacoes</span><span className="sm:hidden">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assinatura</span><span className="sm:hidden">Plano</span>
          </TabsTrigger>
          <TabsTrigger value="bancario" className="gap-1.5 text-xs sm:text-sm">
            <Landmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dados Bancarios</span><span className="sm:hidden">Banco</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notificacoes</span><span className="sm:hidden">Alertas</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Informacoes Tab ─── */}
        <TabsContent value="dados" className="mt-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="shadow-card border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" /> Informacoes pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow icon={Mail} label="Email" value={user.email} />
                {user.cpf && <InfoRow icon={CreditCard} label="CPF" value={formatCPF(user.cpf)} />}
                <InfoRow icon={UserIcon} label="Membro desde" value={formatDate(user.created_at)} />
              </CardContent>
            </Card>
            <Card className="shadow-card border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4 text-secondary" /> Informacoes profissionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow icon={Stethoscope} label="CRM/CRP" value={doctorProfile?.crm_crp || "Nao informado"} />
                <InfoRow icon={Briefcase} label="Especialidade" value={doctorProfile?.especialidade || "Nao informada"} />
                <Separator className="my-1" />
                <div>
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground"><NotebookPen className="h-3.5 w-3.5" /> Biografia</div>
                  {doctorProfile?.bio ? <p className="text-sm leading-relaxed text-foreground">{doctorProfile.bio}</p> : <p className="text-sm italic text-muted-foreground">Nenhuma biografia.</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-3 shadow-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-primary" /> Valor padrao da consulta</CardTitle>
              <CardDescription className="text-xs">Aplicado automaticamente nos pagamentos dos pacientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmitDefaultValue}>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="valor-padrao-consulta" className="text-xs">Valor (R$)</Label>
                  <Input id="valor-padrao-consulta" type="number" min="0" step="0.01" inputMode="decimal" value={valorPadraoInput} onChange={(e) => setValorPadraoInput(e.target.value)} placeholder="Ex.: 200" className="h-9" />
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Atual: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorPadraoAtual || 0)}</p>
                  <Button type="submit" size="sm" disabled={isSavingDefaultValue || isLoading}>{isSavingDefaultValue ? "Salvando..." : "Salvar"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Assinatura Tab (Redesigned) ─── */}
        <TabsContent value="assinatura" className="mt-3 space-y-4">
          {/* Current Plan Hero */}
          <Card className="shadow-card border-border/60 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Crown className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano atual</p>
                    <h3 className="text-xl font-bold">{currentPlan?.name || "Nenhum plano"}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {currentPlan && (
                        <span className="text-sm font-semibold text-primary">
                          {formatDoctorPlanPrice(currentPlan.price_monthly)}/mes
                        </span>
                      )}
                      {subscription?.includes_ai_chatbot && (
                        <Badge variant="secondary" className="h-5 px-2 text-[10px] gap-1">
                          <Sparkles className="h-3 w-3" /> IA + Chatbot
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {currentPlan && (
                  <Badge className="w-fit border-0 bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]">
                    <Check className="mr-1 h-3 w-3" /> Ativa
                  </Badge>
                )}
              </div>

              {currentPlan?.description && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{currentPlan.description}</p>
              )}

              {/* Plan features summary */}
              {currentPlan && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Agenda", available: true },
                    { label: "Financeiro", available: true },
                    { label: "Relatorios", available: true },
                    { label: "IA + Chatbot", available: subscription?.includes_ai_chatbot },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-1.5 text-xs">
                      {f.available ? (
                        <Check className="h-3.5 w-3.5 text-[hsl(142,70%,45%)]" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                      <span className={f.available ? "text-foreground" : "text-muted-foreground/60"}>{f.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-primary" /> Metodos de pagamento
                </CardTitle>
                {!isAddingPayment && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => { resetCardForm(); setIsAddingPayment(true); }}>
                    <Plus className="h-3 w-3" /> Novo
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs">Cartoes utilizados para cobranca mensal do plano.</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 && !isAddingPayment ? (
                <div className="py-6 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhum metodo cadastrado</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setIsAddingPayment(true)}>
                    <Plus className="h-3 w-3" /> Adicionar cartao
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{method.brand} •••• {method.last4}</p>
                          <p className="text-xs text-muted-foreground">{method.holder_name} · {method.exp_month}/{method.exp_year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditPayment(method)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit form */}
              {isAddingPayment && (
                <div className="mt-3 rounded-lg border border-primary/30 bg-muted/10 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">{editingPaymentId ? "Editar cartao" : "Novo cartao"}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetCardForm}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Titular</Label>
                      <Input placeholder="Nome no cartao" value={cardForm.holder_name} onChange={(e) => setCardForm((f) => ({ ...f, holder_name: e.target.value }))} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CPF/CNPJ</Label>
                      <Input placeholder="Documento do titular" value={cardForm.holder_document} onChange={(e) => setCardForm((f) => ({ ...f, holder_document: e.target.value }))} className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Numero do cartao</Label>
                      <Input placeholder="0000 0000 0000 0000" value={cardForm.card_number} onChange={(e) => setCardForm((f) => ({ ...f, card_number: e.target.value }))} className="h-9" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Mes</Label>
                        <Input placeholder="MM" value={cardForm.exp_month} onChange={(e) => setCardForm((f) => ({ ...f, exp_month: e.target.value }))} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ano</Label>
                        <Input placeholder="YYYY" value={cardForm.exp_year} onChange={(e) => setCardForm((f) => ({ ...f, exp_year: e.target.value }))} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CVV</Label>
                        <Input placeholder="•••" value={cardForm.cvv} onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value }))} className="h-9" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="ghost" size="sm" onClick={resetCardForm}>Cancelar</Button>
                    <Button size="sm" onClick={() => addPaymentMethod()} disabled={isAddingPaymentMethod}>
                      {isAddingPaymentMethod ? "Salvando..." : editingPaymentId ? "Atualizar" : "Adicionar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Plan */}
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4 text-primary" /> Alterar plano</CardTitle>
              <CardDescription className="text-xs">Compare opcoes e altere quando precisar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <DoctorPlanCard
                    key={plan.code}
                    plan={plan}
                    index={Math.max(plans.findIndex((item) => item.code === plan.code), 0)}
                    mode="profile"
                    highlighted={highlightedPlan?.code === plan.code}
                    selected={selectedPlan === plan.code}
                    onSelect={() => setSelectedPlan(plan.code)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={() => changePlan()} disabled={isChangingPlan || !selectedPlan}>
                {isChangingPlan ? "Atualizando..." : "Alterar plano"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Dados Bancarios Tab ─── */}
        <TabsContent value="bancario" className="mt-3 space-y-3">
          <Card className="border-border/40 shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm"><Landmark className="h-4 w-4 text-primary" /> Contas bancarias</CardTitle>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setIsAddingBank(true)}>
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
              <CardDescription className="text-xs">Cadastre as contas onde deseja receber os pagamentos das consultas.</CardDescription>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 && !isAddingBank ? (
                <div className="py-8 text-center">
                  <Landmark className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Adicione uma conta bancaria para receber seus pagamentos.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setIsAddingBank(true)}>
                    <Plus className="h-3 w-3" /> Cadastrar conta
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{acc.banco}</p>
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{ACCOUNT_TYPE_LABELS[acc.tipo]}</Badge>
                          {acc.isDefault && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Principal</Badge>}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">Ag: {acc.agencia} · Conta: {acc.conta}</p>
                        <p className="text-xs text-muted-foreground">{acc.titularNome} · {acc.titularCpfCnpj}</p>
                        {acc.pixKey && <p className="text-xs text-muted-foreground">PIX: {acc.pixKey}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        {!acc.isDefault && (
                          <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => handleSetDefaultBank(acc.id)}>Definir principal</Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemoveBank(acc.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isAddingBank && (
            <Card className="border-primary/30 shadow-card animate-in fade-in slide-in-from-top-2 duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Nova conta bancaria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Banco *</Label>
                    <Input placeholder="Ex: Nubank, Itau" value={bankForm.banco} onChange={(e) => setBankForm((f) => ({ ...f, banco: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de conta *</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={bankForm.tipo} onChange={(e) => setBankForm((f) => ({ ...f, tipo: e.target.value as BankAccountType }))}>
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupanca</option>
                      <option value="pagamento">Conta Pagamento</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Agencia *</Label>
                    <Input placeholder="0001" value={bankForm.agencia} onChange={(e) => setBankForm((f) => ({ ...f, agencia: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Conta *</Label>
                    <Input placeholder="12345-6" value={bankForm.conta} onChange={(e) => setBankForm((f) => ({ ...f, conta: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nome do titular *</Label>
                    <Input placeholder="Nome completo" value={bankForm.titularNome} onChange={(e) => setBankForm((f) => ({ ...f, titularNome: e.target.value }))} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CPF/CNPJ do titular *</Label>
                    <Input placeholder="000.000.000-00" value={bankForm.titularCpfCnpj} onChange={(e) => setBankForm((f) => ({ ...f, titularCpfCnpj: e.target.value }))} className="h-9" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Chave PIX (opcional)</Label>
                  <Input placeholder="CPF, e-mail, telefone ou chave aleatoria" value={bankForm.pixKey} onChange={(e) => setBankForm((f) => ({ ...f, pixKey: e.target.value }))} className="h-9" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsAddingBank(false); setBankForm({ banco: "", agencia: "", conta: "", tipo: "corrente", titularNome: "", titularCpfCnpj: "", pixKey: "" }); }}>Cancelar</Button>
                  <Button size="sm" onClick={handleAddBank}>Salvar conta</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-3">
          <NotificationPreferencesCard userId={user.id} role={user.role} description="Defina quais alertas deseja receber e para onde envia-los." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
