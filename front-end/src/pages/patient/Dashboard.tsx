import { useState, useEffect, useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { dashboardApi, paymentsApi, doctorsApi } from "@/api/endpoints";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { dayjs, formatDateTime, formatTime } from "@/lib/date";
import type { DashboardKPIs, Payment, PaymentStatus, DoctorResponse } from "@/types/api";
import { AppointmentStatus } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Calendar, Stethoscope, FileText, User, ArrowRight,
  ChevronLeft, ChevronRight, Droplets, Apple, Brain,
  Moon as MoonIcon, Activity, Sparkles, Search, CreditCard,
  Bell, ClipboardList, CheckCircle2, AlertCircle, Upload,
  Video, Clock, MapPin, XCircle, RefreshCw,
} from "lucide-react";

/* ─── Health tips carousel ─── */
const healthTips = [
  { icon: Droplets, title: "Hidratação", description: "Beba pelo menos 2L de água por dia.", color: "from-primary/10 to-primary/5", iconColor: "text-primary" },
  { icon: Apple, title: "Alimentação", description: "Inclua frutas e verduras em todas as refeições.", color: "from-secondary/10 to-secondary/5", iconColor: "text-secondary" },
  { icon: Brain, title: "Saúde mental", description: "Reserve momentos de pausa e relaxamento.", color: "from-primary/10 to-primary/5", iconColor: "text-primary" },
  { icon: Activity, title: "Exercícios", description: "30 min de atividade física reduzem riscos crônicos.", color: "from-tertiary/10 to-tertiary/5", iconColor: "text-tertiary" },
  { icon: MoonIcon, title: "Sono", description: "Durma 7–9h por noite para recarregar.", color: "from-primary/10 to-primary/5", iconColor: "text-primary" },
];

/* ─── Quick actions ─── */
const quickActions = [
  { icon: Calendar, title: "Minhas consultas", description: "Próximas e passadas", href: "/app/appointments" },
  { icon: FileText, title: "Meu prontuário", description: "Histórico clínico", href: "/app/medical-record" },
  { icon: Upload, title: "Exames", description: "Enviar documentos", href: "/app/medical-record" },
  { icon: CreditCard, title: "Pagamentos", description: "Faturas e recibos", href: "/app/payments" },
];

const specialtyChips = ["Clínico geral", "Psicologia", "Dermatologia", "Ortopedia", "Cardiologia"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { referenceMonth } = useDashboardPeriodStore();
  const [tipIndex, setTipIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const nextTip = useCallback(() => setTipIndex((i) => (i + 1) % healthTips.length), []);
  const prevTip = useCallback(() => setTipIndex((i) => (i - 1 + healthTips.length) % healthTips.length), []);

  useEffect(() => {
    const id = setInterval(nextTip, 6000);
    return () => clearInterval(id);
  }, [nextTip]);

  const { data: kpis } = useQuery<DashboardKPIs>({
    queryKey: ["dashboard-kpis", referenceMonth],
    queryFn: async () => { const { data } = await dashboardApi.getKPIs(referenceMonth); return data; },
    placeholderData: keepPreviousData,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["patient-payments"],
    queryFn: async () => { const { data } = await paymentsApi.list(0, 50); return data; },
  });

  // Fetch all doctors for search autocomplete
  const { data: allDoctors = [] } = useQuery<DoctorResponse[]>({
    queryKey: ["doctors-autocomplete"],
    queryFn: async () => { const { data } = await doctorsApi.list(); return data; },
  });

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allDoctors
      .filter((d) => {
        const nome = d.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const esp = (d.doctor_profile?.especialidade || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nome.includes(q) || esp.includes(q);
      });
  }, [searchQuery, allDoctors]);

  const pendingPayments = payments?.filter((p) => p.status === (1 as PaymentStatus)) || [];
  const pendingPaymentTotal = pendingPayments.reduce((sum, p) => sum + p.valor, 0);

  const firstName = user?.nome?.split(" ")[0] || "Paciente";
  const tip = healthTips[tipIndex];
  const TipIcon = tip.icon;

  const nextAppointments = useMemo(() => {
    const now = dayjs();
    return (kpis?.proximos_atendimentos || [])
      .filter((appt) => appt.status === AppointmentStatus.AGENDADA)
      .filter((appt) => {
        const start = appt.slot?.inicio || appt.created_at;
        return dayjs(start).isAfter(now);
      })
      .sort(
        (a, b) =>
          dayjs(a.slot?.inicio || a.created_at).valueOf() -
          dayjs(b.slot?.inicio || b.created_at).valueOf()
      );
  }, [kpis?.proximos_atendimentos]);
  const nextAppointment = nextAppointments[0];

  const pendingItems: Array<{ label: string; action: string; href: string; icon: typeof AlertCircle }> = [];
  if (!user?.patient_profile?.telefone) {
    pendingItems.push({ label: "Completar perfil (telefone)", action: "Completar", href: "/app/profile", icon: User });
  }
  if (!user?.patient_profile?.convenio) {
    pendingItems.push({ label: "Informar convênio", action: "Adicionar", href: "/app/profile", icon: ClipboardList });
  }
  if (pendingPayments.length > 0) {
    pendingItems.push({ label: `Pagar pendência (${pendingPayments.length})`, action: "Pagar", href: "/app/payments", icon: CreditCard });
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/app/doctors?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectDoctor = (doctor: DoctorResponse) => {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate(`/app/doctors?q=${encodeURIComponent(doctor.nome)}&openDoctor=${doctor.id}`);
  };

  return (
    <div className="space-y-4 pb-2">
      {/* ─── Header: Greeting + Search + CTA ─── */}
      <section className="relative overflow-visible rounded-2xl border border-border/40 bg-card p-4 shadow-card sm:p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-secondary/5 blur-2xl" />

        <div className="relative space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{getGreeting()} 👋</p>
              <h1 className="text-lg font-bold sm:text-2xl">{firstName}</h1>
            </div>
            <Button onClick={() => navigate("/app/doctors")} size="sm" className="shrink-0 text-xs sm:text-sm">
              <Stethoscope className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Agendar consulta</span>
              <span className="sm:hidden">Agendar</span>
            </Button>
          </div>

          {/* Search with autocomplete dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar médico, especialidade ou procedimento..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* Autocomplete suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[60] mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-elevated max-h-[300px] overflow-y-auto">
                {searchSuggestions.map((doctor) => (
                  <button
                    key={doctor.id}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    onMouseDown={() => handleSelectDoctor(doctor)}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doctor.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {doctor.doctor_profile?.especialidade || "Médico"}
                        {doctor.doctor_profile?.valor_padrao_consulta
                          ? ` · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(doctor.doctor_profile.valor_padrao_consulta)}`
                          : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {specialtyChips.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/40 text-[10px] sm:text-xs"
                onClick={() => navigate(`/app/doctors?specialty=${encodeURIComponent(s)}`)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Health tips (moved UP for more visibility) ─── */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dicas de saúde</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevTip}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex gap-1">
              {healthTips.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTipIndex(i)}
                  className={`h-1 rounded-full transition-all ${i === tipIndex ? "w-3 bg-primary" : "w-1 bg-muted-foreground/30"}`}
                  aria-label={`Dica ${i + 1}`}
                />
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextTip}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-border/40 shadow-card">
          <CardContent className="p-0">
            <div className={`flex items-center gap-4 bg-gradient-to-r ${tip.color} p-4`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-sm">
                <TipIcon className={`h-5 w-5 ${tip.iconColor}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─── Quick actions ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className="group cursor-pointer border-border/40 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5"
                onClick={() => navigate(action.href)}
              >
                <CardContent className="flex flex-col items-center gap-1.5 p-3 sm:p-4 text-center">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-sm font-semibold leading-tight">{action.title}</p>
                    <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Next appointment card ─── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          Próxima consulta
        </h2>

        {nextAppointment ? (
          <Card className="overflow-hidden border-border/40 shadow-card">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div className="flex items-center justify-center bg-primary/10 px-6 py-4 sm:flex-col sm:px-8 sm:py-6">
                  <span className="text-xs font-medium uppercase text-primary sm:text-sm">
                    {dayjs(nextAppointment.slot?.inicio).format("MMM")}
                  </span>
                  <span className="ml-2 text-2xl font-bold text-primary sm:ml-0 sm:text-3xl">
                    {dayjs(nextAppointment.slot?.inicio).format("DD")}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground sm:ml-0 sm:mt-1">
                    {dayjs(nextAppointment.slot?.inicio).format("ddd")}
                  </span>
                </div>

                <div className="flex-1 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-lg">{nextAppointment.doctor?.nome || "Médico"}</p>
                    <StatusBadge status={nextAppointment.status} type="appointment" />
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(nextAppointment.slot?.inicio || "")} – {formatTime(nextAppointment.slot?.fim || "")}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Presencial
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {nextAppointment.status === AppointmentStatus.AGENDADA && (
                      <Button size="sm" variant="default">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Confirmar presença
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate("/app/appointments")}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Reagendar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/40 shadow-card">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhuma consulta agendada</p>
                <p className="mt-1 text-sm text-muted-foreground">Encontre o profissional ideal para você</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={() => navigate("/app/doctors")}>
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  Buscar especialidade
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/app/doctors")}>
                  <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                  Ver médicos disponíveis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ─── Pending checklist ─── */}
      {pendingItems.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-warning" />
            Pendências
          </h2>
          <Card className="border-border/40 shadow-card divide-y divide-border/40">
            {pendingItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3 p-3 sm:p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                      <Icon className="h-4 w-4 text-warning" />
                    </div>
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(item.href)}>
                    {item.action}
                  </Button>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      {/* ─── Summary cards ─── */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="border-border/40 shadow-card cursor-pointer transition-all hover:shadow-elevated" onClick={() => navigate("/app/payments")}>
          <CardContent className="flex flex-col items-center gap-1 p-3 sm:p-4 text-center">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            <p className="text-base font-bold sm:text-2xl">
              {pendingPayments.length > 0
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(pendingPaymentTotal)
                : "—"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Pgtos pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-card cursor-pointer transition-all hover:shadow-elevated" onClick={() => navigate("/app/appointments")}>
          <CardContent className="flex flex-col items-center gap-1 p-3 sm:p-4 text-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <p className="text-base font-bold sm:text-2xl">{kpis?.total_consultas_mes || 0}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Consultas este mês</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-card cursor-pointer transition-all hover:shadow-elevated">
          <CardContent className="flex flex-col items-center gap-1 p-3 sm:p-4 text-center">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
            <p className="text-base font-bold sm:text-2xl">0</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Notificações</p>
          </CardContent>
        </Card>
      </section>

      {/* ─── Upcoming appointments list ─── */}
      {nextAppointments.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Próximas consultas
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/appointments")}>
              Ver todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <Card className="border-border/40 shadow-card divide-y divide-border/40">
            {nextAppointments.slice(0, 3).map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{appt.doctor?.nome || "Médico"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(appt.slot?.inicio || appt.created_at)}
                  </p>
                </div>
                <StatusBadge status={appt.status} type="appointment" />
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
