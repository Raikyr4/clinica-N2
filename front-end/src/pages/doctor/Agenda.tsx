import { useMemo, useState, useCallback, useEffect } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { agendaApi, appointmentsApi, doctorLocationsApi, profilesApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import {
  Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight,
  Eye, CheckCircle, XCircle, Search, Filter, CalendarDays,
  LayoutList, CalendarRange, Layers, MapPin,
} from "lucide-react";
import { dayjs, formatDate, formatDateTime, formatTime } from "@/lib/date";
import { AppointmentStatus, SlotStatus, SlotStatusLabel, UserRole } from "@/types/api";
import type { AgendaSlot, Appointment, DoctorLocation, DoctorProfile } from "@/types/api";
import PatientRecordDialog from "@/components/medical/PatientRecordDialog";

type ViewMode = "semana" | "mes" | "lista";
type LayerKey = "consultas" | "disponibilidades";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7:00 to 23:00
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];


export default function Agenda() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("semana");
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ slot?: AgendaSlot; appointment?: Appointment } | null>(null);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [slotLocationId, setSlotLocationId] = useState("");
  const [valorConsultaInput, setValorConsultaInput] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("none");
  const [highlightedDay, setHighlightedDay] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    consultas: true, disponibilidades: true});
    
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [recordCtx, setRecordCtx] = useState<{
    patientId: string; patientName?: string; appointmentId?: string;
  } | null>(null);
  const [confirmRealizadaOpen, setConfirmRealizadaOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmRemoveSlotOpen, setConfirmRemoveSlotOpen] = useState(false);

  const { data: locations = [] } = useQuery<DoctorLocation[]>({
    queryKey: ["doctor-locations"],
    queryFn: async () => (await doctorLocationsApi.list()).data,
    placeholderData: keepPreviousData,
  });

  const { data: doctorProfile } = useQuery<DoctorProfile>({
    queryKey: ["doctor-profile-me"],
    queryFn: async () => (await profilesApi.getDoctorMe()).data,
    placeholderData: keepPreviousData,
  });

  const { data: appointmentHistory = [] } = useQuery<Appointment[]>({
    queryKey: ["agenda-patients-history"],
    queryFn: async () => (await appointmentsApi.list(0, 1000)).data,
    placeholderData: keepPreviousData,
  });

  // Date range based on view
  const dateRange = useMemo(() => {
    if (viewMode === "semana") {
      const start = referenceDate.startOf("week");
      const end = referenceDate.endOf("week");
      return { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD"), label: `${start.format("DD")}–${end.format("DD [de] MMMM [de] YYYY")}` };
    }
    const start = referenceDate.startOf("month");
    const end = referenceDate.endOf("month");
    if (viewMode === "mes") return { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD"), label: referenceDate.format("MMMM [de] YYYY") };
    return { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD"), label: referenceDate.format("MMMM [de] YYYY") };
  }, [referenceDate, viewMode]);

  const capitalizedLabel = dateRange.label.charAt(0).toUpperCase() + dateRange.label.slice(1);
  const isDoctor = user?.role === UserRole.MEDICO;

  const patients = useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>();

    appointmentHistory
      .filter((appointment) => appointment.status === AppointmentStatus.REALIZADA)
      .forEach((appointment) => {
        const patientId = appointment.patient?.id || appointment.patient_id;
        const patientName = appointment.patient?.nome;
        if (!patientId || !patientName || map.has(patientId)) return;
        map.set(patientId, { id: patientId, nome: patientName });
      });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [appointmentHistory]);

  // Data queries
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["agenda-slots", user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await agendaApi.getAgenda(user.id, dateRange.start, dateRange.end);
      return data;
    },
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["agenda-appts", referenceDate.format("YYYY-MM")],
    queryFn: async () => {
      const { data } = await appointmentsApi.list(0, 200, referenceDate.format("YYYY-MM"));
      return data;
    },
    placeholderData: keepPreviousData,
  });

  // Mutations
  const createSlot = useMutation({
    mutationFn: async () => {
      if (!user?.id || !inicio || !fim || !slotLocationId) throw new Error("Campos obrigatórios");
      const normalizedValue = valorConsultaInput.replace(",", ".").trim();
      const valorConsulta = normalizedValue ? Number(normalizedValue) : undefined;
      if (normalizedValue && Number.isNaN(valorConsulta)) throw new Error("Informe um valor de consulta válido");
      if (valorConsulta !== undefined && valorConsulta < 0) throw new Error("O valor da consulta deve ser maior ou igual a zero");

      const { data: slot } = await agendaApi.createSlot(user.id, {
        inicio,
        fim,
        doctor_location_id: slotLocationId,
        valor_consulta: valorConsulta,
      });

      if (isDoctor && selectedPatientId !== "none") {
        await appointmentsApi.create({ slot_id: slot.id, patient_id: selectedPatientId });
      }

      return slot;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-slots"] });
      qc.invalidateQueries({ queryKey: ["agenda-appts"] });
      toast.success(selectedPatientId !== "none" ? "Consulta agendada com sucesso!" : "Horário criado!");
      setIsCreateOpen(false);
      setInicio(""); setFim(""); setSlotLocationId(""); setValorConsultaInput(""); setSelectedPatientId("none");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || e.message || "Erro ao criar horário"),
  });

  const deleteSlot = useMutation({
    mutationFn: (id: string) => agendaApi.deleteSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-slots"] });
      toast.success("Horário removido!");
      setSelectedEvent(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Erro ao remover"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { data } = await appointmentsApi.updateStatus(id, { status });
      return data;
    },
    onSuccess: (appt) => {
      qc.invalidateQueries({ queryKey: ["agenda-slots"] });
      qc.invalidateQueries({ queryKey: ["agenda-appts"] });
      toast.success("Status atualizado!");
      if (selectedEvent) setSelectedEvent({ ...selectedEvent, appointment: appt });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Erro ao atualizar"),
  });

  const navigateOffset = (offset: number) => {
    const unit = viewMode === "semana" ? "week" : "month";
    setReferenceDate((d) => d.add(offset, unit));
  };

  const goToday = () => {
    const today = dayjs();
    setReferenceDate(today);
    setViewMode("semana");
    setHighlightedDay(today.format("YYYY-MM-DD"));
    setTimeout(() => setHighlightedDay(""), 2600);
  };
  const toggleLayer = (key: LayerKey) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  const openCreateDialog = () => {
    const defaultValue = doctorProfile?.valor_padrao_consulta;
    setValorConsultaInput(defaultValue !== undefined && defaultValue !== null ? String(Number(defaultValue)) : "");
    setSelectedPatientId("none");
    setIsCreateOpen(true);
  };

  const apptBySlotId = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments.forEach((a) => { if (a.slot_id) map.set(a.slot_id, a); });
    return map;
  }, [appointments]);

  const weekDays = useMemo(() => {
    const start = referenceDate.startOf("week");
    return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
  }, [referenceDate]);

  const todayStr = dayjs().format("YYYY-MM-DD");

  const locationNameById = useMemo(() => {
    return new Map(locations.map((loc) => [loc.id, loc.nome.toLowerCase()]));
  }, [locations]);

  const filteredSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return [...slots]
      .filter((slot) => {
        const appt = apptBySlotId.get(slot.id);
        const hasAppointment = !!appt;
        const isAvailability = slot.status === SlotStatus.LIVRE && !hasAppointment;
        const isBlocked = !hasAppointment && !isAvailability;

        if (hasAppointment && !layers.consultas) return false;
        if (isAvailability && !layers.disponibilidades) return false;

        if (locationFilter !== "all" && slot.doctor_location_id !== locationFilter) return false;

        if (statusFilter !== "todos") {
          if (!appt) return false;
          if (statusFilter === "agendadas" && appt.status !== AppointmentStatus.AGENDADA) return false;
          if (statusFilter === "realizadas" && appt.status !== AppointmentStatus.REALIZADA) return false;
          if (statusFilter === "canceladas" && appt.status !== AppointmentStatus.CANCELADA) return false;
        }

        if (!q) return true;

        const patientName = appt?.patient?.nome?.toLowerCase() || "";
        const locationName = (slot.doctor_location_id && locationNameById.get(slot.doctor_location_id)) || "";
        return patientName.includes(q) || locationName.includes(q);
      })
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }, [slots, apptBySlotId, layers, locationFilter, statusFilter, searchQuery, locationNameById]);

  const filteredSlotIds = useMemo(() => new Set(filteredSlots.map((slot) => slot.id)), [filteredSlots]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => !appt.slot_id || filteredSlotIds.has(appt.slot_id))
      .sort((a, b) => new Date(a.slot?.inicio || a.created_at).getTime() - new Date(b.slot?.inicio || b.created_at).getTime());
  }, [appointments, filteredSlotIds]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, AgendaSlot[]>();
    filteredSlots.forEach((slot) => {
      const d = formatDate(slot.inicio);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(slot);
    });
    return map;
  }, [filteredSlots]);

  const monthDays = useMemo(() => {
    const start = referenceDate.startOf("month").startOf("week");
    const end = referenceDate.endOf("month").endOf("week");
    const days: dayjs.Dayjs[] = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, "day")) { days.push(cur); cur = cur.add(1, "day"); }
    return days;
  }, [referenceDate]);

  const getEventsForDay = useCallback((day: dayjs.Dayjs) => {
    const dayStr = day.format("YYYY-MM-DD");
    const daySlots = filteredSlots.filter((s) => dayjs(s.inicio).format("YYYY-MM-DD") === dayStr);
    const dayAppts = filteredAppointments.filter((a) => dayjs(a.slot?.inicio || a.created_at).format("YYYY-MM-DD") === dayStr);
    return { slots: daySlots, appointments: dayAppts };
  }, [filteredSlots, filteredAppointments]);

  const isLoading = loadingSlots || loadingAppts;
  const hasData = filteredSlots.length > 0 || filteredAppointments.length > 0 || slots.length > 0 || appointments.length > 0;
  if (isLoading && !hasData) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:h-[calc(100vh-4.5rem)] lg:overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full shrink-0 space-y-3 lg:space-y-4 lg:w-64 flex flex-col md:flex-row lg:flex-col gap-3 md:gap-3 lg:gap-0">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-3">
            <MiniCalendar referenceDate={referenceDate} onSelect={(d) => {
              setReferenceDate(d.startOf("day"));
              setViewMode("semana");
              setHighlightedDay(d.format("YYYY-MM-DD"));
              setTimeout(() => setHighlightedDay(""), 2600);
            }} onToday={goToday} />
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Camadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {([
              { key: "consultas" as LayerKey, label: "Consultas", color: "bg-primary" },
              { key: "disponibilidades" as LayerKey, label: "Disponibilidades", color: "bg-secondary" },
            ]).map((l) => (
              <label key={l.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={layers[l.key]} onCheckedChange={() => toggleLayer(l.key)} />
                <div className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                {l.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {(["todos", "agendadas", "realizadas", "canceladas"] as const).map((f) => (
                  <Button key={f} size="sm" variant={statusFilter === f ? "default" : "outline"} className="h-7 text-xs" onClick={() => setStatusFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Location filter */}
            {locations.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Localidade</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <MapPin className="mr-1.5 h-3 w-3" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Paciente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <Card className="shadow-card border-border/60">
          <CardContent className="p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateOffset(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateOffset(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{capitalizedLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border/60 overflow-hidden">
                  {([
                    { key: "semana" as ViewMode, icon: CalendarRange, label: "Semana" },
                    { key: "mes" as ViewMode, icon: CalendarDays, label: "Mês" },
                    { key: "lista" as ViewMode, icon: LayoutList, label: "Lista" },
                  ]).map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setViewMode(v.key)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === v.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      <v.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{v.label}</span>
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="mr-1 h-4 w-4" /> Novo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week view with scrollable time grid */}
        {viewMode === "semana" && (
          <Card className="shadow-card border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[600px] md:min-w-[700px]">
                  {/* Scrollable time grid */}
                  <div className="max-h-[60vh] md:max-h-[550px] overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
                    {/* Day headers */}
                    <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40 bg-card">
                      <div className="p-2" />
                      {weekDays.map((d) => {
                        const dayStr = d.format("YYYY-MM-DD");
                        const isToday = dayStr === todayStr;
                        const isHighlighted = highlightedDay === dayStr;
                        return (
                          <div key={dayStr} className={`p-2 text-center border-l border-border/40 ${isToday ? "bg-primary/5" : ""} ${isHighlighted ? "animate-pulse bg-primary/10" : ""}`}>
                            <p className="text-xs text-muted-foreground">{WEEKDAYS[d.day() === 0 ? 6 : d.day() - 1]}</p>
                            <p className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{d.format("DD")}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="relative">
                      {HOURS.map((hour) => (
                        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 h-16">
                          <div className="p-1 text-right pr-2">
                            <span className="text-[11px] text-muted-foreground">{String(hour).padStart(2, "0")}:00</span>
                          </div>
                          {weekDays.map((d) => {
                            const dayStr = d.format("YYYY-MM-DD");
                            const isToday = dayStr === todayStr;
                            const isHighlighted = highlightedDay === dayStr;
                            const hourSlots = filteredSlots.filter((s) => {
                              const sDay = dayjs(s.inicio).format("YYYY-MM-DD");
                              const sHour = dayjs(s.inicio).hour();
                              return sDay === dayStr && sHour === hour;
                            });

                            return (
                              <div
                                key={dayStr + hour}
                                className={`border-l border-border/20 relative cursor-pointer hover:bg-muted/30 transition-colors ${isToday ? "bg-primary/[0.02]" : ""} ${isHighlighted ? "animate-pulse" : ""}`}
                                onClick={() => {
                                  const dt = d.hour(hour).minute(0).format("YYYY-MM-DDTHH:mm");
                                  const dtEnd = d.hour(hour).minute(30).format("YYYY-MM-DDTHH:mm");
                                  setInicio(dt); setFim(dtEnd); openCreateDialog();
                                }}
                              >
                                {hourSlots.map((s) => {
                                  const appt = apptBySlotId.get(s.id);
                                  const isFree = s.status === SlotStatus.LIVRE && !appt;
                                  const isBooked = s.status === SlotStatus.RESERVADO || !!appt;
                                  const isRealized = appt?.status === AppointmentStatus.REALIZADA;
                                  const isCanceled = appt?.status === AppointmentStatus.CANCELADA;


                                  let colorClass = "bg-secondary/10 border border-dashed border-secondary/40 text-secondary";
                                  if (isRealized) {
                                    colorClass = "bg-green-500/15 border border-green-500/40 text-green-700 dark:text-green-400";
                                  } else if (isCanceled) {
                                    colorClass = "bg-destructive/15 border border-destructive/40 text-destructive";
                                  } else if (isBooked) {
                                    colorClass = "bg-primary/15 border border-primary/30 text-primary";
                                  }

                                  return (
                                    <div
                                      key={s.id}
                                      onClick={(e) => { e.stopPropagation(); setSelectedEvent({ slot: s, appointment: appt }); }}
                                      className={`absolute inset-x-0.5 rounded-md px-1.5 py-0.5 text-[10px] leading-tight cursor-pointer transition-all hover:ring-2 hover:ring-primary/30 ${colorClass}`}
                                      style={{
                                        top: `${(dayjs(s.inicio).minute() / 60) * 64}px`,
                                        height: `${Math.max((dayjs(s.fim).diff(dayjs(s.inicio), "minute") / 60) * 64, 18)}px`,
                                      }}
                                    >
                                      <p className="font-medium truncate">
                                        {appt ? appt.patient?.nome?.split(" ")[0] || "Consulta" : "Livre"}
                                      </p>
                                      <p className="opacity-70">{formatTime(s.inicio)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "mes" && (
          <Card className="shadow-card border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b border-border/40">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground border-l first:border-l-0 border-border/40">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((d) => {
                  const dayStr = d.format("YYYY-MM-DD");
                  const isToday = dayStr === todayStr;
                  const isCurrentMonth = d.month() === referenceDate.month();
                  const ev = getEventsForDay(d);
                  return (
                    <div
                      key={dayStr}
                      className={`min-h-[80px] border-l border-b border-border/20 first:border-l-0 p-1 cursor-pointer hover:bg-muted/30 ${!isCurrentMonth ? "opacity-40" : ""} ${isToday ? "bg-primary/5" : ""}`}
                      onClick={() => { setReferenceDate(d); setViewMode("semana"); }}
                    >
                      <p className={`text-xs font-medium ${isToday ? "text-primary font-bold" : ""}`}>{d.format("D")}</p>
                      {ev.appointments.length > 0 && (
                        <div className="mt-0.5">
                          <Badge variant="default" className="text-[9px] h-5 px-1">{ev.appointments.length} cons.</Badge>
                        </div>
                      )}
                      {ev.slots.filter((s) => s.status === SlotStatus.LIVRE && !apptBySlotId.has(s.id)).length > 0 && (
                        <div className="mt-0.5">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-secondary/40 text-secondary">
                            {ev.slots.filter((s) => s.status === SlotStatus.LIVRE && !apptBySlotId.has(s.id)).length} livres
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "lista" && (
          <Card className="shadow-card border-border/60">
            <CardContent className="pt-4">
              {filteredSlots.length === 0 ? (
                <EmptyState icon={Calendar} title="Nenhum horário encontrado" description="Ajuste os filtros ou crie novas disponibilidades." actionLabel="Criar disponibilidade" onAction={() => setIsCreateOpen(true)} />
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-6 pr-2">
                    {Array.from(groupedByDate.entries()).map(([date, daySlots]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                          <Badge variant="secondary" className="text-[10px] h-5">{daySlots.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {daySlots.map((slot) => {
                            const appt = apptBySlotId.get(slot.id);
                            return (
                              <div
                                key={slot.id}
                                onClick={() => setSelectedEvent({ appointment: appt, slot })}
                                className="flex items-center gap-3 rounded-xl border border-border/40 p-3 cursor-pointer hover:bg-muted/50 transition-all"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                  {formatTime(slot.inicio)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {appt?.patient?.nome || SlotStatusLabel[slot.status]}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(slot.inicio)}
                                    {slot.fim ? ` – ${formatTime(slot.fim)}` : ""}
                                  </p>
                                </div>
                                {appt ? (
                                  <StatusBadge status={appt.status} type="appointment" />
                                ) : (
                                  <Badge variant="outline">{SlotStatusLabel[slot.status]}</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Slot Dialog – now includes location */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{isDoctor ? "Nova marcação" : "Nova disponibilidade"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!slotLocationId) {
              toast.error("Selecione a localidade de atendimento.");
              return;
            }
            createSlot.mutate();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} required />
            </div>
                          <div className="space-y-2">
                <Label>Localidade</Label>
                <Select value={slotLocationId} onValueChange={setSlotLocationId}>
                  <SelectTrigger>
                    <MapPin className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.nome} – {loc.cidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {locations.length === 0 && (
                  <p className="text-xs text-destructive">
                    Você precisa cadastrar ao menos uma localidade antes de criar horários.
                  </p>
                )}
              </div>
            {isDoctor && (
              <div className="space-y-2">
                <Label>Paciente (opcional)</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Criar só disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Criar só disponibilidade</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>{patient.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se selecionar um paciente, será criada uma consulta agendada e pendente de pagamento.
                </p>
                {patients.length === 0 && (
                  <p className="text-xs text-warning">
                    Nenhum paciente com consulta realizada foi encontrado para vinculação.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="valor-consulta">Valor da consulta (R$)</Label>
              <Input
                id="valor-consulta"
                type="number"
                min="0"
                step="0.01"
                value={valorConsultaInput}
                onChange={(e) => setValorConsultaInput(e.target.value)}
                placeholder="Ex.: 150.00"
              />
              <p className="text-xs text-muted-foreground">
                Campo preenchido automaticamente com o valor padrão definido no seu perfil, mas você pode alterar para esta marcação.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createSlot.isPending || locations.length === 0}>
                {createSlot.isPending ? "Criando..." : selectedPatientId !== "none" ? "Criar consulta" : "Criar horário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog (was Sheet, now centered Dialog) */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.appointment ? "Detalhes da consulta" : "Detalhes do horário"}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.appointment && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Paciente</p>
                    <p className="font-medium">{selectedEvent.appointment.patient?.nome || "Paciente"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <StatusBadge status={selectedEvent.appointment.status} type="appointment" />
                  </div>
                </>
              )}
              {selectedEvent.slot && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="font-medium">{formatDateTime(selectedEvent.slot.inicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fim</p>
                      <p className="font-medium">{formatDateTime(selectedEvent.slot.fim)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status do horário</p>
                    <Badge variant="outline" className="mt-1">{SlotStatusLabel[selectedEvent.slot.status]}</Badge>
                  </div>
                </>
              )}
              {selectedEvent.appointment?.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="mt-1 text-sm">{selectedEvent.appointment.observacoes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                {selectedEvent.appointment?.patient?.id && (
                  <Button variant="default" className="w-full" onClick={() => {
                    setRecordCtx({
                      patientId: selectedEvent.appointment!.patient!.id,
                      patientName: selectedEvent.appointment!.patient?.nome,
                      appointmentId: selectedEvent.appointment!.id,
                    });
                  }}>
                    <Eye className="mr-2 h-4 w-4" /> Abrir prontuário
                  </Button>
                )}
                {selectedEvent.appointment?.status === AppointmentStatus.AGENDADA && (
                  <Button variant="outline" className="w-full" onClick={() => setConfirmRealizadaOpen(true)} disabled={updateStatus.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Marcar como realizada
                  </Button>
                )}
                {selectedEvent.appointment?.status === AppointmentStatus.AGENDADA && (
                  <Button variant="destructive" className="w-full" onClick={() => setConfirmCancelOpen(true)} disabled={updateStatus.isPending}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar consulta
                  </Button>
                )}
                {selectedEvent.slot?.status === SlotStatus.LIVRE && !selectedEvent.appointment && (
                  <Button variant="destructive" className="w-full" onClick={() => setConfirmRemoveSlotOpen(true)} disabled={deleteSlot.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remover horário
                  </Button>
                )}
              </div>
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

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmRealizadaOpen}
        onOpenChange={setConfirmRealizadaOpen}
        title="Marcar como realizada"
        description="Deseja marcar esta consulta como realizada?"
        confirmLabel="Confirmar"
        onConfirm={() => {
          setConfirmRealizadaOpen(false);
          if (selectedEvent?.appointment) {
            updateStatus.mutate({ id: selectedEvent.appointment.id, status: AppointmentStatus.REALIZADA });
          }
        }}
      />
      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancelar consulta"
        description="Informe o motivo do cancelamento da consulta."
        confirmLabel="Cancelar consulta"
        variant="destructive"
        withInput
        inputLabel="Motivo do cancelamento"
        inputPlaceholder="Descreva o motivo..."
        onConfirm={() => {
          setConfirmCancelOpen(false);
          if (selectedEvent?.appointment) {
            updateStatus.mutate({ id: selectedEvent.appointment.id, status: AppointmentStatus.CANCELADA });
          }
        }}
      />
      <ConfirmDialog
        open={confirmRemoveSlotOpen}
        onOpenChange={setConfirmRemoveSlotOpen}
        title="Remover horário"
        description="Tem certeza que deseja remover este horário da agenda?"
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => {
          setConfirmRemoveSlotOpen(false);
          if (selectedEvent?.slot) {
            deleteSlot.mutate(selectedEvent.slot.id);
          }
        }}
      />
    </div>
  );
}

/* Mini Calendar Component */
function MiniCalendar({ referenceDate, onSelect, onToday }: {
  referenceDate: dayjs.Dayjs;
  onSelect: (d: dayjs.Dayjs) => void;
  onToday: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(referenceDate);

  useEffect(() => {
    setViewMonth(referenceDate);
  }, [referenceDate]);

  const days = useMemo(() => {
    const start = viewMonth.startOf("month").startOf("week");
    const end = viewMonth.endOf("month").endOf("week");
    const result: dayjs.Dayjs[] = [];
    let cur = start;
    while (cur.isBefore(end) || cur.isSame(end, "day")) { result.push(cur); cur = cur.add(1, "day"); }
    return result;
  }, [viewMonth]);

  const todayStr = dayjs().format("YYYY-MM-DD");
  const selectedStr = referenceDate.format("YYYY-MM-DD");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMonth((m) => m.subtract(1, "month"))}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <button onClick={onToday} className="text-xs font-semibold hover:text-primary transition-colors">
          {viewMonth.format("MMM YYYY")}
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewMonth((m) => m.add(1, "month"))}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {days.map((d) => {
          const dStr = d.format("YYYY-MM-DD");
          const isToday = dStr === todayStr;
          const isSelected = dStr === selectedStr;
          const isCurrentMonth = d.month() === viewMonth.month();
          return (
            <button
              key={dStr}
              onClick={() => onSelect(d)}
              className={`text-[11px] h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                isSelected ? "bg-primary text-primary-foreground font-bold"
                  : isToday ? "bg-primary/10 text-primary font-semibold"
                    : isCurrentMonth ? "hover:bg-muted" : "text-muted-foreground/40"
              }`}
            >
              {d.format("D")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
