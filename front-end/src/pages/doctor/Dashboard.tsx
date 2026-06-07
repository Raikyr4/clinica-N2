import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorApi, appointmentsApi, paymentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Calendar, DollarSign, TrendingUp, Users, ArrowRight, RefreshCw, Clock, ChevronLeft, ChevronRight,
  Wallet, FilePieChart, Bell, Stethoscope, Sun, Moon, CloudSun,
  CalendarPlus, PlayCircle, FileText, CreditCard,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dayjs, formatDateTime, formatTime } from "@/lib/date";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { Appointment, DashboardKPIs, FinancialInsights, Payment } from "@/types/api";
import { AppointmentStatus, PaymentStatus } from "@/types/api";
import PatientRecordDialog from "@/components/medical/PatientRecordDialog";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";
import { useAuthStore } from "@/store/auth";

const REFRESH_INTERVAL = 3 * 60 * 1000;

function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Bom dia", icon: Sun };
  if (h < 18) return { text: "Boa tarde", icon: CloudSun };
  return { text: "Boa noite", icon: Moon };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const pctFmt = (v: number) => `${Math.round(v)}%`;

const getPaymentDate = (payment: Payment) => payment.data_pagamento || payment.created_at;

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { referenceMonth, setReferenceMonth } = useDashboardPeriodStore();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recordCtx, setRecordCtx] = useState<{
    patientId: string; patientName?: string; appointmentId?: string;
  } | null>(null);

  const refetchInterval = (query: { state: { fetchStatus: string } }) => {
    if (typeof document !== "undefined" && document.hidden) return false;
    return query.state.fetchStatus === "fetching" ? false : REFRESH_INTERVAL;
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["doc-kpis"], type: "active" }),
        qc.refetchQueries({ queryKey: ["doc-fin"], type: "active" }),
        qc.refetchQueries({ queryKey: ["doc-appts"], type: "active" }),
        qc.refetchQueries({ queryKey: ["doc-payments"], type: "active" }),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const qOpts = { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnMount: true as const, refetchOnWindowFocus: true, refetchInterval, refetchIntervalInBackground: false, placeholderData: keepPreviousData };

  const handleMonthOffset = (offset: number) => {
    setReferenceMonth(dayjs(referenceMonth).add(offset, "month").format("YYYY-MM"));
  };

  const { data: kpis, isLoading } = useQuery<DashboardKPIs>({
    queryKey: ["doc-kpis", referenceMonth],
    queryFn: async () => (await doctorApi.getDashboard(referenceMonth)).data,
    ...qOpts,
  });

  const { data: insights } = useQuery<FinancialInsights>({
    queryKey: ["doc-fin", referenceMonth],
    queryFn: async () => (await doctorApi.getFinancial(referenceMonth)).data,
    ...qOpts,
  });

  const { data: appts = [] } = useQuery<Appointment[]>({
    queryKey: ["doc-appts", referenceMonth],
    queryFn: async () => (await appointmentsApi.list(0, 200, referenceMonth)).data,
    ...qOpts,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["doc-payments"],
    queryFn: async () => (await paymentsApi.list(0, 200)).data,
    ...qOpts,
  });

  // Derived data
  const todayStr = dayjs().format("YYYY-MM-DD");

  const filteredAppts = useMemo(
    () => appts.filter((a) => dayjs(a.slot?.inicio || a.created_at).isSame(dayjs(`${referenceMonth}-01`), "month")),
    [appts, referenceMonth]
  );

  const todayAppts = useMemo(() =>
    appts
      .filter((a) => dayjs(a.slot?.inicio || a.created_at).format("YYYY-MM-DD") === todayStr)
      .sort((a, b) => new Date(a.slot?.inicio || a.created_at).getTime() - new Date(b.slot?.inicio || b.created_at).getTime()),
    [appts, todayStr]
  );

  const patients = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; total: number }>();
    filteredAppts.forEach((a) => {
      const p = a.patient;
      if (!p?.id) return;
      const c = map.get(p.id);
      if (c) c.total += 1;
      else map.set(p.id, { id: p.id, nome: p.nome, total: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredAppts]);

  const pendingPayments = useMemo(() => {
    const monthStart = dayjs(`${referenceMonth}-01`);
    const monthEnd = monthStart.endOf("month");
    const apptIds = new Set(filteredAppts.map((a) => a.id));

    const approvedInPeriod = new Set(
      payments
        .filter((payment) => {
          if (payment.status !== PaymentStatus.APROVADO) return false;
          if (!apptIds.has(payment.appointment_id)) return false;
          const paymentDate = dayjs(getPaymentDate(payment));
          return !paymentDate.isBefore(monthStart) && !paymentDate.isAfter(monthEnd);
        })
        .map((payment) => payment.appointment_id)
    );

    return filteredAppts
      .filter((appointment) => appointment.status !== AppointmentStatus.CANCELADA && !approvedInPeriod.has(appointment.id))
      .sort((a, b) => new Date(a.slot?.inicio || a.created_at).getTime() - new Date(b.slot?.inicio || b.created_at).getTime());
  }, [filteredAppts, payments, referenceMonth]);

  const periodLabel = `Mês (${dayjs(`${referenceMonth}-01`).format("MM/YYYY")})`;

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const greeting = getGreeting();
  const GIcon = greeting.icon;
  const firstName = user?.nome?.split(" ")[0] || "Doutor(a)";
  const isBusy = isRefreshing;

  const quickActions = [
    { label: "Criar horários", icon: CalendarPlus, onClick: () => navigate("/doctor/agenda"), color: "bg-primary/10 text-primary" },
    { label: "Ver tarefas", icon: PlayCircle, onClick: () => navigate("/doctor/tasks"), color: "bg-tertiary/10 text-tertiary" },
    { label: "Emitir relatório", icon: FileText, onClick: () => navigate("/doctor/reports"), color: "bg-tertiary/10 text-tertiary" },
    { label: `Atestados (${2})`, icon: FileText, onClick: () => navigate("/doctor/certificates"), color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="space-y-5">
      {/* Header + Period filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">{greeting.text}, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            {todayAppts.length > 0
              ? `${todayAppts.length} consulta${todayAppts.length > 1 ? "s" : ""} hoje`
              : "Nenhuma consulta agendada para hoje"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleMonthOffset(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="month"
            className="w-[140px] sm:w-[180px] h-8 text-xs sm:text-sm shrink-0"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
          />
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleMonthOffset(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleRefresh} disabled={isBusy}>
            <RefreshCw className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Calendar} label={`Consultas · ${periodLabel}`} value={String(filteredAppts.length)} accent="primary" />
        <KpiCard icon={DollarSign} label={`Faturamento · ${periodLabel}`} value={fmt(kpis?.faturamento_mes || 0)} accent="secondary" />
        <KpiCard icon={TrendingUp} label="Ocupação" value={pctFmt(kpis?.taxa_ocupacao || 0)} accent="warning" />
        <button onClick={() => navigate("/doctor/patients")} className="text-left">
          <KpiCard icon={Users} label={`Pacientes · ${periodLabel}`} value={String(patients.length)} accent="primary" />
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações rápidas</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex items-center gap-2.5 rounded border bg-card p-3 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main grid: Today's agenda + Widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Today's agenda - actionable */}
        <Card className="shadow-card border-border/60 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Agenda de hoje</CardTitle>
                <Badge variant="secondary" className="text-xs">{todayAppts.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/doctor/agenda")}>
                Ver agenda <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayAppts.length === 0 ? (
              <EmptyState
                icon={Stethoscope}
                title="Sem consultas hoje"
                description="Aproveite para organizar sua agenda ou criar novos horários."
                actionLabel="Criar disponibilidade"
                onAction={() => navigate("/doctor/agenda")}
              />
            ) : (
              todayAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3 transition-all hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {formatTime(a.slot?.inicio || a.created_at)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.patient?.nome || "Paciente"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(a.slot?.inicio || a.created_at)}
                      {a.slot?.fim ? ` – ${formatTime(a.slot.fim)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={a.status} type="appointment" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Abrir prontuário" onClick={() => {
                      if (a.patient?.id) setRecordCtx({ patientId: a.patient.id, patientName: a.patient.nome, appointmentId: a.id });
                    }} disabled={!a.patient?.id}>
                      <FilePieChart className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Detalhes" onClick={() => setSelectedAppointment(a)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Widgets column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Pending payments widget - compact count only */}
          <Card className="shadow-card border-border/60 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/doctor/financial")}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Pagamentos pendentes</p>
                <p className="text-xl font-bold">{pendingPayments.length}</p>
              </div>
              {pendingPayments.length > 0 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CardContent>
          </Card>

          {/* Financial summary widget */}
          {insights && (
            <Card className="shadow-card border-border/60 min-h-[200px]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <CardTitle className="text-sm">Resumo financeiro</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recebido</span>
                  <span className="text-sm font-semibold text-secondary">{fmt(insights.receita_recebida)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">A receber</span>
                  <span className="text-sm font-semibold">{fmt(insights.receita_prevista)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ticket médio</span>
                  <span className="text-sm font-semibold">{fmt(insights.ticket_medio)}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs" onClick={() => navigate("/doctor/financial")}>
                  Ver financeiro completo <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Patients Dialog */}
      <Dialog open={isPatientsOpen} onOpenChange={setIsPatientsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Pacientes ({periodLabel})</DialogTitle>
            <DialogDescription>Pacientes com consultas no período.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {patients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum paciente.</p>
            ) : patients.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.total === 1 ? "1 consulta" : `${p.total} consultas`}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(o) => { if (!o) setSelectedAppointment(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da consulta</DialogTitle>
            <DialogDescription>Informações e ações da consulta.</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">{selectedAppointment.patient?.nome || "Paciente"}</p>
                </div>
                <StatusBadge status={selectedAppointment.status} type="appointment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-medium">{formatDateTime(selectedAppointment.slot?.inicio || selectedAppointment.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fim</p>
                  <p className="font-medium">{selectedAppointment.slot?.fim ? formatTime(selectedAppointment.slot.fim) : "--"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="mt-1 text-sm">{selectedAppointment.observacoes || "Nenhuma observação."}</p>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => {
                  if (selectedAppointment.patient?.id) {
                    setRecordCtx({ patientId: selectedAppointment.patient.id, patientName: selectedAppointment.patient.nome, appointmentId: selectedAppointment.id });
                  }
                }} disabled={!selectedAppointment.patient?.id}>
                  <FilePieChart className="mr-2 h-4 w-4" /> Prontuário
                </Button>
                {selectedAppointment.status === AppointmentStatus.AGENDADA && (
                  <Button variant="default" onClick={() => {
                    setSelectedAppointment(null);
                    navigate("/doctor/agenda");
                  }}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Gerenciar na agenda
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {recordCtx && (
        <PatientRecordDialog
          open={Boolean(recordCtx)}
          patientId={recordCtx.patientId}
          patientName={recordCtx.patientName}
          appointmentId={recordCtx.appointmentId}
          onOpenChange={(o) => { if (!o) setRecordCtx(null); }}
        />
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: {
  icon: typeof Calendar; label: string; value: string;
  accent: "primary" | "secondary" | "warning";
}) {
  const colors = {
    primary: "text-primary",
    secondary: "text-secondary",
    warning: "text-warning",
  };
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-3 p-3">
        <Icon className={`h-5 w-5 shrink-0 ${colors[accent]}`} />
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
