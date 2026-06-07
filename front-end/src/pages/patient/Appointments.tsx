import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, medicalCertificatesApi, paymentsApi } from "@/api/endpoints";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Calendar,
  CreditCard,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dayjs, formatDateTime, formatTime } from "@/lib/date";
import { AppointmentStatus, PaymentStatus } from "@/types/api";
import type { Appointment } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

type TabKey = "all" | "agendadas" | "realizadas" | "canceladas" | "pagas";

export default function Appointments() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [certificateAppointment, setCertificateAppointment] = useState<Appointment | null>(null);
  const [certificateReason, setCertificateReason] = useState("");
  const queryClient = useQueryClient();

  const referenceMonth = referenceDate.format("YYYY-MM");

  const handlePreviousMonth = () => setReferenceDate((prev) => prev.subtract(1, "month"));
  const handleNextMonth = () => setReferenceDate((prev) => prev.add(1, "month"));
  const handleToday = () => setReferenceDate(dayjs());

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointments", referenceMonth],
    queryFn: async () => {
      const { data } = await appointmentsApi.list(0, 100, referenceMonth);
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await paymentsApi.list();
      return data;
    },
  });

  const { data: certificateRequestsData } = useQuery({
    queryKey: ["medical-certificate-requests", "patient"],
    queryFn: async () => {
      const { data } = await medicalCertificatesApi.listPatient();
      return data;
    },
  });

  const certificateRequests = certificateRequestsData || [];

  const appointments = appointmentsData || [];
  const payments = paymentsData || [];

  const isPaid = (id: string) =>
    payments.some((p) => p.appointment_id === id && p.status === PaymentStatus.APROVADO);

  const getFiltered = () => {
    if (activeTab === "all") return appointments;
    if (activeTab === "pagas") {
      const paidIds = payments.filter((p) => p.status === PaymentStatus.APROVADO).map((p) => p.appointment_id);
      return appointments.filter((a) => paidIds.includes(a.id));
    }
    const map: Record<string, AppointmentStatus> = {
      agendadas: AppointmentStatus.AGENDADA,
      realizadas: AppointmentStatus.REALIZADA,
      canceladas: AppointmentStatus.CANCELADA,
    };
    return appointments.filter((a) => a.status === map[activeTab]);
  };

  const filtered = getFiltered();

  /* group by date */
  const grouped: Record<string, Appointment[]> = {};
  filtered.forEach((a) => {
    const key = dayjs(a.slot?.inicio || a.created_at).format("YYYY-MM-DD");
    (grouped[key] ??= []).push(a);
  });
  const sortedDates = Object.keys(grouped).sort();

  const requestCertificateMutation = useMutation({
    mutationFn: async ({ appointmentId, motivo }: { appointmentId: string; motivo: string }) => {
      const { data } = await medicalCertificatesApi.request({ appointment_id: appointmentId, motivo });
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitação de atestado enviada para análise médica.");
      setCertificateAppointment(null);
      setCertificateReason("");
      queryClient.invalidateQueries({ queryKey: ["medical-certificate-requests", "patient"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Não foi possível solicitar atestado.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await appointmentsApi.cancel(id);
      return data;
    },
    onSuccess: (apt) => {
      toast.success("Consulta cancelada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setSelectedAppointment(apt);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Não foi possível cancelar.");
    },
  });

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const handleCancel = (apt: Appointment) => {
    if (apt.status !== AppointmentStatus.AGENDADA || cancelMutation.isPending) return;
    setCancelTarget(apt);
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Minhas Consultas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerencie suas consultas e pagamentos</p>
        </div>
        <Button onClick={() => navigate("/app/doctors")} className="w-full sm:w-auto">
          <Calendar className="mr-2 h-4 w-4" />
          Nova consulta
        </Button>
      </div>

      {/* Period nav */}
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3 shadow-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button onClick={handleToday} className="text-sm font-semibold capitalize hover:text-primary transition-colors">
          {referenceDate.format("MMMM [de] YYYY")}
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-auto min-w-full gap-1 bg-muted/50 p-1 sm:grid sm:w-full sm:grid-cols-5">
            {(["all", "agendadas", "realizadas", "canceladas", "pagas"] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab === "all" ? "Todas" : tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card className="border-border/40 shadow-card">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="rounded-full bg-muted p-5">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Nenhuma consulta encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Tente outro período ou agende uma nova consulta.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/app/doctors")}>
                  Agendar consulta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dateAppts = grouped[dateKey];
                const d = dayjs(dateKey);
                const isToday = d.isSame(dayjs(), "day");

                return (
                  <div key={dateKey}>
                    {/* Date header */}
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className={`flex h-10 w-10 flex-col items-center justify-center rounded-xl text-xs font-bold ${
                          isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px] uppercase leading-none">{d.format("MMM")}</span>
                        <span className="text-sm leading-none">{d.format("DD")}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize">{d.format("dddd")}</p>
                        {isToday && <p className="text-[10px] text-primary font-medium">Hoje</p>}
                      </div>
                    </div>

                    {/* Appointments for this date */}
                    <div className="ml-5 space-y-2 border-l-2 border-border/40 pl-5">
                      {dateAppts.map((apt) => (
                        <Card
                          key={apt.id}
                          className="cursor-pointer border-border/40 shadow-card transition-all hover:shadow-elevated hover:-translate-y-px"
                          onClick={() => setSelectedAppointment(apt)}
                        >
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 sm:flex">
                              <Clock className="h-5 w-5 text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-medium">
                                  {apt.doctor?.nome || "Médico"}
                                </p>
                                <StatusBadge status={apt.status} type="appointment" />
                                {isPaid(apt.id) && (
                                  <StatusBadge status={PaymentStatus.APROVADO} type="payment" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(apt.slot?.inicio || "")}
                                {apt.slot?.fim && ` – ${formatTime(apt.slot.fim)}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              {apt.status === AppointmentStatus.AGENDADA && !isPaid(apt.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/app/payment/${apt.id}`);
                                  }}
                                  className="hidden sm:inline-flex"
                                >
                                  <CreditCard className="mr-1 h-3 w-3" />
                                  Pagar
                                </Button>
                              )}
                              {apt.status === AppointmentStatus.REALIZADA && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCertificateAppointment(apt);
                                  }}
                                  className="hidden sm:inline-flex"
                                >
                                  Solicitar atestado
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>



      <Dialog open={!!certificateAppointment} onOpenChange={(open) => !open && setCertificateAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar atestado médico</DialogTitle>
            <DialogDescription>
              Descreva brevemente o motivo da solicitação para a consulta selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Consulta: {certificateAppointment?.id.slice(0, 8)}…</p>
            <Textarea
              value={certificateReason}
              onChange={(e) => setCertificateReason(e.target.value)}
              placeholder="Ex.: comprovação de ausência no trabalho no dia do atendimento"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificateAppointment(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!certificateAppointment) return;
                requestCertificateMutation.mutate({ appointmentId: certificateAppointment.id, motivo: certificateReason.trim() });
              }}
              disabled={requestCertificateMutation.isPending || certificateReason.trim().length < 5}
            >
              {requestCertificateMutation.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(o) => !o && setSelectedAppointment(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:w-full">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Detalhes da consulta
                </DialogTitle>
                <DialogDescription>Informações sobre o agendamento selecionado.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Médico</p>
                    <p className="font-semibold">{selectedAppointment.doctor?.nome || "—"}</p>
                  </div>
                  <StatusBadge status={selectedAppointment.status} type="appointment" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{formatDateTime(selectedAppointment.slot?.inicio || selectedAppointment.created_at)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="text-sm font-medium">{selectedAppointment.slot?.fim ? formatDateTime(selectedAppointment.slot.fim) : "--"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="mt-1 text-sm">{selectedAppointment.observacoes || "Nenhuma observação."}</p>
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {isPaid(selectedAppointment.id) ? "✅ Pagamento aprovado" : "⏳ Pagamento pendente"}
                </p>
                <div className="flex gap-2">
                  {selectedAppointment.status === AppointmentStatus.AGENDADA && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancel(selectedAppointment)} disabled={cancelMutation.isPending}>
                      <X className="mr-1 h-3 w-3" />
                      {cancelMutation.isPending ? "Cancelando..." : "Cancelar"}
                    </Button>
                  )}
                  {selectedAppointment.status === AppointmentStatus.AGENDADA && !isPaid(selectedAppointment.id) && (
                    <Button size="sm" onClick={() => navigate(`/app/payment/${selectedAppointment.id}`)}>
                      <CreditCard className="mr-1 h-3 w-3" />
                      Pagar
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => { if (!o) setCancelTarget(null); }}
        title="Cancelar consulta"
        description="Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita."
        confirmLabel="Cancelar consulta"
        variant="destructive"
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id);
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
