import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi, agendaApi, appointmentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "sonner";
import { Calendar, Clock, ArrowLeft, Check, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { dayjs, formatDate, formatTime } from "@/lib/date";
import { SlotStatus } from "@/types/api";
import type { AgendaSlot } from "@/types/api";

export default function Schedule() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<AgendaSlot | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const startDate = dayjs().format("YYYY-MM-DD");
  const endDate = dayjs().add(30, "days").format("YYYY-MM-DD");

  const { data: doctor, isLoading: isLoadingDoctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      const { data } = await doctorsApi.get(doctorId);
      return data;
    },
    enabled: !!doctorId,
  });

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["agenda", doctorId, startDate, endDate],
    queryFn: async () => {
      if (!doctorId) throw new Error("Doctor ID is required");
      const { data } = await agendaApi.getAgenda(doctorId, startDate, endDate);
      return data;
    },
    enabled: !!doctorId,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data } = await appointmentsApi.create({ slot_id: slotId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Consulta agendada com sucesso!");
      setLastCreatedId(data.id);
      setShowPaymentDialog(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao agendar consulta");
    },
  });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const freeSlots = slots?.filter((s) => s.status === SlotStatus.LIVRE) || [];

  // Group by date
  const groupedDates = useMemo(() => {
    const map: Record<string, AgendaSlot[]> = {};
    freeSlots.forEach((slot) => {
      const date = dayjs(slot.inicio).format("YYYY-MM-DD");
      if (!map[date]) map[date] = [];
      map[date].push(slot);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({
        date,
        label: dayjs(date).format("ddd, DD [de] MMM"),
        dayLabel: dayjs(date).format("DD"),
        weekday: dayjs(date).format("ddd"),
        month: dayjs(date).format("MMM"),
        slots: slots.sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()),
      }));
  }, [freeSlots]);

  const currentDateGroup = groupedDates[selectedDateIndex];

  const handleSlotClick = (slot: AgendaSlot) => {
    if (slot.status === SlotStatus.LIVRE) {
      setSelectedSlot(slot);
    }
  };

  const handleConfirmAppointment = () => {
    if (selectedSlot) {
      createAppointmentMutation.mutate(selectedSlot.id);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoadingDoctor || isLoadingSlots) {
    return (
      <div className="container mx-auto px-4 py-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyState
          icon={Calendar}
          title="Médico não encontrado"
          description="O médico solicitado não foi encontrado."
          actionLabel="Voltar"
          onAction={() => navigate("/app/doctors")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/doctors")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Doctor Profile Card - redesigned */}
      <Card className="shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="h-20 w-20 ring-4 ring-card shadow-lg">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(doctor.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{doctor.nome}</h2>
                {doctor.doctor_profile?.especialidade && (
                  <p className="text-muted-foreground">{doctor.doctor_profile.especialidade}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {doctor.doctor_profile?.crm_crp && (
                  <Badge variant="outline" className="text-xs">{doctor.doctor_profile.crm_crp}</Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1">
                  <Star className="h-3 w-3 text-warning fill-warning" /> 4.8
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <MapPin className="h-3 w-3" /> Presencial
                </Badge>
              </div>
              {doctor.doctor_profile?.valor_padrao_consulta != null && (
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(doctor.doctor_profile.valor_padrao_consulta)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ consulta</span>
                </p>
              )}
            </div>
          </div>
        </div>
        {doctor.doctor_profile?.bio && (
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{doctor.doctor_profile.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Date selector - horizontal scroll */}
      {groupedDates.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Selecione uma data
              </CardTitle>
              <span className="text-xs text-muted-foreground">{groupedDates.length} dias disponíveis</span>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedDateIndex((i) => Math.max(0, i - 1))}
                disabled={selectedDateIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 pb-1">
                  {groupedDates.map((group, i) => (
                    <button
                      key={group.date}
                      onClick={() => { setSelectedDateIndex(i); setSelectedSlot(null); }}
                      className={`flex flex-col items-center shrink-0 rounded-xl border-2 px-4 py-3 min-w-[72px] transition-all ${
                        i === selectedDateIndex
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/40 hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-medium text-muted-foreground">{group.weekday}</span>
                      <span className="text-lg font-bold leading-tight">{group.dayLabel}</span>
                      <span className="text-[10px] text-muted-foreground">{group.month}</span>
                      <Badge variant="secondary" className="mt-1 text-[9px] h-4 px-1.5">
                        {group.slots.length} {group.slots.length === 1 ? "vaga" : "vagas"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSelectedDateIndex((i) => Math.min(groupedDates.length - 1, i + 1))}
                disabled={selectedDateIndex === groupedDates.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time slots for selected date */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {currentDateGroup
              ? `Horários - ${currentDateGroup.label}`
              : "Horários disponíveis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {freeSlots.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhum horário disponível"
              description="Não há horários livres para este médico nos próximos 30 dias."
            />
          ) : currentDateGroup ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {currentDateGroup.slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={`group relative flex flex-col items-center gap-0.5 rounded-xl border-2 p-3 transition-all ${
                    selectedSlot?.id === slot.id
                      ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                      : "border-border/40 bg-card hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <Clock className={`h-4 w-4 ${selectedSlot?.id === slot.id ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold">{formatTime(slot.inicio)}</span>
                  <span className={`text-[10px] ${selectedSlot?.id === slot.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    até {formatTime(slot.fim)}
                  </span>
                  {doctor?.doctor_profile?.valor_padrao_consulta != null && (
                    <span className={`text-[10px] font-semibold mt-0.5 ${selectedSlot?.id === slot.id ? "text-primary-foreground" : "text-primary"}`}>
                      {formatCurrency(doctor.doctor_profile.valor_padrao_consulta)}
                    </span>
                  )}
                  {selectedSlot?.id === slot.id && (
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Selecione uma data acima.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation */}
      {selectedSlot && (
        <Card className="shadow-elevated border-primary/30 sticky bottom-20 sm:bottom-4 z-40">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horário selecionado</p>
                  <p className="text-base font-bold">{formatDate(selectedSlot.inicio)}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedSlot.inicio)} – {formatTime(selectedSlot.fim)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {doctor.doctor_profile?.valor_padrao_consulta != null && (
                  <p className="text-lg font-bold text-primary">{formatCurrency(doctor.doctor_profile.valor_padrao_consulta)}</p>
                )}
                <Button
                  size="lg"
                  onClick={handleConfirmAppointment}
                  disabled={createAppointmentMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createAppointmentMutation.isPending ? (
                    "Agendando..."
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar agendamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showPaymentDialog}
        onOpenChange={(o) => {
          if (!o) {
            setShowPaymentDialog(false);
            navigate("/app/appointments");
          }
        }}
        title="Consulta agendada!"
        description="Deseja realizar o pagamento agora?"
        confirmLabel="Pagar agora"
        cancelLabel="Depois"
        onConfirm={() => {
          setShowPaymentDialog(false);
          if (lastCreatedId) navigate(`/app/payment/${lastCreatedId}`);
        }}
      />
    </div>
  );
}
