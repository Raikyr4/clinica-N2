import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { paymentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime, dayjs } from "@/lib/date";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import {
  User, Mail, Phone, Calendar as CalendarIcon, CreditCard, Shield,
  Bell, ChevronLeft, ChevronRight, Filter, Search, Calendar,
  Plus, Trash2, Wallet, Landmark, Smartphone,
} from "lucide-react";
import type { Payment } from "@/types/api";
import { PaymentStatus } from "@/types/api";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const ITEMS_PER_PAGE = 10;
type StatusFilter = "todos" | "aprovado" | "negado" | "estornado";

// ── Payment Method types (local state, no backend yet) ──
type PaymentMethodType = "pix" | "cartao" | "boleto";
interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  details: string;
  isDefault: boolean;
}

const METHOD_META: Record<PaymentMethodType, { icon: typeof CreditCard; label: string; color: string }> = {
  pix: { icon: Smartphone, label: "PIX", color: "text-emerald-600" },
  cartao: { icon: CreditCard, label: "Cartão", color: "text-blue-600" },
  boleto: { icon: Landmark, label: "Boleto", color: "text-amber-600" },
};

export default function Profile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dados");

  // ── Payment history state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [page, setPage] = useState(1);
  const referenceMonth = referenceDate.format("YYYY-MM");

  // ── Payment methods state ──
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: "1", type: "pix", label: "PIX Pessoal", details: "***@email.com", isDefault: true },
  ]);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PaymentMethodType>("pix");
  const [newMethodLabel, setNewMethodLabel] = useState("");
  const [newMethodDetails, setNewMethodDetails] = useState("");

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const formatCPF = (cpf: string) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  const formatPhone = (phone: string) =>
    phone.length === 11 ? phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : phone;

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["patient-all-payments"],
    queryFn: async () => (await paymentsApi.list(0, 500)).data,
    placeholderData: keepPreviousData,
  });

  // ── Filtered payments ──
  const filtered = useMemo(() => {
    let result = payments;
    if (statusFilter !== "todos") {
      const statusMap: Record<string, PaymentStatus> = {
        aprovado: PaymentStatus.APROVADO,
        negado: PaymentStatus.NEGADO,
        estornado: PaymentStatus.ESTORNADO,
      };
      result = result.filter((p) => p.status === statusMap[statusFilter]);
    }
    result = result.filter((p) => {
      const refDate = p.data_pagamento || p.created_at;
      return dayjs(refDate).format("YYYY-MM") === referenceMonth;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.appointment?.doctor?.nome?.toLowerCase().includes(q) ||
        p.metodo?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, statusFilter, search, referenceMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const summary = useMemo(() => {
    const monthPayments = payments.filter((p) => {
      const refDate = p.data_pagamento || p.created_at;
      return dayjs(refDate).format("YYYY-MM") === referenceMonth;
    });
    const approved = monthPayments.filter((p) => p.status === PaymentStatus.APROVADO);
    const refunded = monthPayments.filter((p) => p.status === PaymentStatus.ESTORNADO);
    return {
      total: approved.reduce((s, p) => s + p.valor, 0),
      count: approved.length,
      refundedTotal: refunded.reduce((s, p) => s + p.valor, 0),
      refundedCount: refunded.length,
    };
  }, [payments, referenceMonth]);

  // ── Payment methods handlers ──
  const handleAddMethod = () => {
    if (!newMethodLabel.trim() || !newMethodDetails.trim()) return;
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newMethodType,
      label: newMethodLabel.trim(),
      details: newMethodDetails.trim(),
      isDefault: methods.length === 0,
    };
    setMethods((prev) => [...prev, newMethod]);
    setNewMethodLabel("");
    setNewMethodDetails("");
    setIsAddingMethod(false);
  };

  const handleRemoveMethod = (id: string) => {
    setMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length > 0 && !next.some((m) => m.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  };

  const handleSetDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
  };

  if (!user) return null;

  const infoItems = [
    { icon: Mail, label: "Email", value: user.email },
    user.cpf ? { icon: CreditCard, label: "CPF", value: formatCPF(user.cpf) } : null,
    user.patient_profile?.telefone
      ? { icon: Phone, label: "Telefone", value: formatPhone(user.patient_profile.telefone) }
      : null,
    user.patient_profile?.data_nascimento
      ? { icon: CalendarIcon, label: "Data de nascimento", value: formatDate(user.patient_profile.data_nascimento) }
      : null,
    { icon: User, label: "Membro desde", value: formatDate(user.created_at) },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <Card className="overflow-hidden border-border/40 shadow-card">
        <div className="bg-primary p-4 sm:p-5">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <Avatar className="h-14 w-14 ring-4 ring-primary-foreground/20 sm:h-16 sm:w-16">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg font-bold sm:text-xl">
                {getInitials(user.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">{user.nome}</h2>
              <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
                  <Shield className="mr-1 h-3 w-3" /> Paciente
                </Badge>
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
                  Conta ativa
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="dados" className="gap-1 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dados</span>
            <span className="sm:hidden">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="gap-1 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pagamentos</span>
            <span className="sm:hidden">Pagar</span>
          </TabsTrigger>
          <TabsTrigger value="metodos" className="gap-1 text-xs sm:text-sm">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Métodos</span>
            <span className="sm:hidden">Carteira</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Alertas</span>
            <span className="sm:hidden">Alertas</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Dados pessoais ── */}
        <TabsContent value="dados" className="mt-3">
          <Card className="border-border/40 shadow-card">
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {infoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="truncate text-sm font-medium">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Pagamentos (full inline) ── */}
        <TabsContent value="pagamentos" className="mt-3 space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-border/40 shadow-card">
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Aprovados</p>
                <p className="text-base font-bold">{fmt(summary.total)}</p>
                <p className="text-[10px] text-muted-foreground">{summary.count} pag.</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-card">
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Estornos</p>
                <p className="text-base font-bold text-destructive">{fmt(summary.refundedTotal)}</p>
                <p className="text-[10px] text-muted-foreground">{summary.refundedCount} est.</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-card">
              <CardContent className="p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Filtrados</p>
                <p className="text-base font-bold">{filtered.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Month navigator */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-2 shadow-card">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReferenceDate((d) => d.subtract(1, "month")); setPage(1); }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button onClick={() => { setReferenceDate(dayjs()); setPage(1); }} className="text-sm font-semibold capitalize hover:text-primary transition-colors">
              {referenceDate.format("MMMM [de] YYYY")}
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setReferenceDate((d) => d.add(1, "month")); setPage(1); }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Search & filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar médico ou método..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-8 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="h-8 w-full sm:w-[130px] text-sm">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="negado">Negado</SelectItem>
                <SelectItem value="estornado">Estornado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment list */}
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={CreditCard} title="Nenhum pagamento" description="Ajuste os filtros ou realize uma consulta." />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-2 sm:hidden">
                {paginated.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.appointment?.doctor?.nome || "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.data_pagamento || p.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{p.metodo === "PIX" ? "PIX" : p.metodo === "DINHEIRO" ? "Dinheiro" : "Cartão"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-medium">{fmt(p.valor)}</p>
                      <StatusBadge status={p.status} type="payment" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDateTime(p.data_pagamento || p.created_at)}</TableCell>
                        <TableCell className="text-sm font-medium">{p.appointment?.doctor?.nome || "—"}</TableCell>
                        <TableCell className="text-sm">{p.metodo === "PIX" ? "PIX" : p.metodo === "DINHEIRO" ? "Dinheiro" : "Cartão"}</TableCell>
                        <TableCell><StatusBadge status={p.status} type="payment" /></TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(p.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab: Métodos de pagamento ── */}
        <TabsContent value="metodos" className="mt-3 space-y-3">
          <Card className="border-border/40 shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Métodos cadastrados
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setIsAddingMethod(true)}>
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {methods.length === 0 ? (
                <div className="py-8 text-center">
                  <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum método cadastrado</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione um método de pagamento para agilizar suas consultas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {methods.map((m) => {
                    const meta = METHOD_META[m.type];
                    const Icon = meta.icon;
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/30">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{m.label}</p>
                            {m.isDefault && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Padrão</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{meta.label} · {m.details}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!m.isDefault && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleSetDefault(m.id)}>
                              Definir padrão
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveMethod(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add method form */}
          {isAddingMethod && (
            <Card className="border-primary/30 shadow-card animate-in fade-in slide-in-from-top-2 duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Novo método de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["pix", "cartao", "boleto"] as PaymentMethodType[]).map((type) => {
                    const meta = METHOD_META[type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewMethodType(type)}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                          newMethodType === type
                            ? "border-primary bg-primary/5"
                            : "border-border/40 hover:border-border"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${newMethodType === type ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Apelido (ex: PIX Pessoal)"
                    value={newMethodLabel}
                    onChange={(e) => setNewMethodLabel(e.target.value)}
                    className="h-9"
                  />
                  <Input
                    placeholder={
                      newMethodType === "pix" ? "Chave PIX (CPF, email, telefone...)"
                        : newMethodType === "cartao" ? "Últimos 4 dígitos do cartão"
                        : "Email para receber boleto"
                    }
                    value={newMethodDetails}
                    onChange={(e) => setNewMethodDetails(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setIsAddingMethod(false); setNewMethodLabel(""); setNewMethodDetails(""); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAddMethod} disabled={!newMethodLabel.trim() || !newMethodDetails.trim()}>
                    Salvar método
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Notificações ── */}
        <TabsContent value="notificacoes" className="mt-3">
          <NotificationPreferencesCard
            userId={user.id}
            role={user.role}
            description="Defina como deseja receber lembretes e atualizações sobre suas consultas."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
