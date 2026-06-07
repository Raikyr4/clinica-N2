import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doctorsApi } from "@/api/endpoints";
import type { DoctorResponse } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Stethoscope, Calendar, Search, Filter, ChevronLeft, ChevronRight,
  Star, MapPin, Clock, X, ArrowUpDown, User,
} from "lucide-react";

const ITEMS_PER_PAGE = 9;

type SortOption = "availability" | "price_asc" | "price_desc" | "name";

const sortLabels: Record<SortOption, string> = {
  availability: "Mais próximos",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  name: "Nome A–Z",
};

const MOCK_LOCATIONS = ["Centro", "Zona Sul", "Zona Norte", "Online"];

const getDoctorLocation = (doctor: DoctorResponse): string => {
  const normalized = doctor.doctor_profile?.bio?.toLowerCase() ?? "";

  if (normalized.includes("online")) {
    return "Online";
  }

  const seed = doctor.id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return MOCK_LOCATIONS[seed % (MOCK_LOCATIONS.length - 1)];
};

export default function Doctors() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("q") || "";
  const initialSpecialty = searchParams.get("specialty") || "all";
  const openDoctorId = searchParams.get("openDoctor") || null;

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data } = await doctorsApi.list();
      return data;
    },
  });

  // Auto-open doctor dialog when navigated with openDoctor param
  useEffect(() => {
    if (openDoctorId && doctors && !selectedDoctor) {
      const doc = doctors.find((d) => d.id === openDoctorId);
      if (doc) setSelectedDoctor(doc);
    }
  }, [openDoctorId, doctors, selectedDoctor]);

  const specialties = useMemo(() => {
    if (!doctors) return [];
    const unique = new Set(
      doctors.map((d) => d.doctor_profile?.especialidade).filter((s): s is string => !!s)
    );
    return Array.from(unique).sort();
  }, [doctors]);

  const hasActiveFilters = searchTerm || selectedSpecialty !== "all" || selectedLocation !== "all";

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    let filtered = [...doctors];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.nome.toLowerCase().includes(q) ||
          d.doctor_profile?.especialidade?.toLowerCase().includes(q)
      );
    }

    if (selectedSpecialty && selectedSpecialty !== "all") {
      filtered = filtered.filter((d) => d.doctor_profile?.especialidade === selectedSpecialty);
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((d) => getDoctorLocation(d) === selectedLocation);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return (a.doctor_profile?.valor_padrao_consulta || 0) - (b.doctor_profile?.valor_padrao_consulta || 0);
        case "price_desc":
          return (b.doctor_profile?.valor_padrao_consulta || 0) - (a.doctor_profile?.valor_padrao_consulta || 0);
        case "name":
        default:
          return a.nome.localeCompare(b.nome, "pt-BR");
      }
    });

    return filtered;
  }, [doctors, searchTerm, selectedSpecialty, selectedLocation, sortBy]);

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => { setSearchTerm(value); setCurrentPage(1); };
  const handleSpecialtyChange = (value: string) => { setSelectedSpecialty(value); setCurrentPage(1); };
  const clearFilters = () => { setSearchTerm(""); setSelectedSpecialty("all"); setSelectedLocation("all"); setSortBy("name"); setCurrentPage(1); };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Nossos Médicos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha um profissional e agende sua consulta
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou especialidade..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select value={selectedSpecialty} onValueChange={handleSpecialtyChange}>
                <SelectTrigger className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <Select value={selectedLocation} onValueChange={(v) => { setSelectedLocation(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Localidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {MOCK_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); setCurrentPage(1); }}>
                <SelectTrigger className="w-full">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortLabels).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredDoctors.length === 0 ? "Nenhum resultado" : `${filteredDoctors.length} resultado${filteredDoctors.length > 1 ? "s" : ""}`}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="mr-1 h-3 w-3" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Doctor cards */}
      {!paginatedDoctors.length ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Stethoscope}
              title={hasActiveFilters ? "Nenhum médico encontrado" : "Nenhum médico disponível"}
              description={hasActiveFilters ? "Tente ajustar seus filtros de busca." : "Não há médicos cadastrados no momento."}
              actionLabel={hasActiveFilters ? "Limpar filtros" : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="shadow-card hover:shadow-elevated transition-all cursor-pointer group"
                onClick={() => setSelectedDoctor(doctor)}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {getInitials(doctor.nome)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 w-full">
                      <h3 className="font-semibold text-base">{doctor.nome}</h3>
                      {doctor.doctor_profile?.especialidade && (
                        <p className="text-sm text-muted-foreground">{doctor.doctor_profile.especialidade}</p>
                      )}

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                          <MapPin className="h-2.5 w-2.5" /> Presencial
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5">
                          <Star className="h-2.5 w-2.5 text-warning fill-warning" /> 4.8
                        </Badge>
                      </div>

                      {doctor.doctor_profile?.valor_padrao_consulta != null && (
                        <p className="text-sm font-medium text-primary pt-1">
                          A partir de {formatCurrency(doctor.doctor_profile.valor_padrao_consulta)}
                        </p>
                      )}

                      <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 pt-0.5">
                        <Clock className="h-3 w-3" /> Próximo horário disponível
                        <span className="mx-0.5">·</span>
                        <MapPin className="h-3 w-3" /> {getDoctorLocation(doctor)}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full pt-1">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/schedule/${doctor.id}`); }}
                      >
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        Ver agenda
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doctor); }}
                      >
                        <User className="mr-1.5 h-3.5 w-3.5" />
                        Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Doctor Profile Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoctor(null);
          if (searchParams.has("openDoctor")) {
            const next = new URLSearchParams(searchParams);
            next.delete("openDoctor");
            setSearchParams(next, { replace: true });
          }
        }
      }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDoctor.nome}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                      {getInitials(selectedDoctor.nome)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedDoctor.doctor_profile?.especialidade && (
                    <Badge variant="secondary">{selectedDoctor.doctor_profile.especialidade}</Badge>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selectedDoctor.doctor_profile?.crm_crp && (
                      <span>{selectedDoctor.doctor_profile.crm_crp}</span>
                    )}
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 text-warning fill-warning" /> 4.8
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow icon={MapPin} label="Modalidade" value="Presencial" />
                  <InfoRow icon={MapPin} label="Local" value={getDoctorLocation(selectedDoctor)} />
                  <InfoRow icon={Clock} label="Duração" value="50 min" />
                  {selectedDoctor.doctor_profile?.valor_padrao_consulta != null && (
                    <InfoRow
                      icon={Stethoscope}
                      label="Valor"
                      value={`A partir de ${formatCurrency(selectedDoctor.doctor_profile.valor_padrao_consulta)}`}
                    />
                  )}
                </div>

                {selectedDoctor.doctor_profile?.bio && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Sobre</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedDoctor.doctor_profile.bio}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => { setSelectedDoctor(null); navigate(`/app/schedule/${selectedDoctor.id}`); }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver agenda e agendar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
