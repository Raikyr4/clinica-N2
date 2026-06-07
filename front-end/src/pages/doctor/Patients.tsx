import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useMutation } from "@tanstack/react-query";
import { appointmentsApi, reportsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Users, Download, ChevronLeft, ChevronRight, FileText, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Appointment } from "@/types/api";
import PatientRecordDialog from "@/components/medical/PatientRecordDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const ITEMS_PER_PAGE = 15;

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface PatientRow {
  id: string;
  nome: string;
  cpf?: string;
  email: string;
  totalConsultas: number;
}

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recordCtx, setRecordCtx] = useState<{
    patientId: string; patientName?: string;
  } | null>(null);
  const [confirmExport, setConfirmExport] = useState(false);
  const [exportTarget, setExportTarget] = useState<"single" | "bulk">("single");
  const [singleExportId, setSingleExportId] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["doctor-all-appointments"],
    queryFn: async () => (await appointmentsApi.list(0, 1000)).data,
    placeholderData: keepPreviousData,
  });

  const patients = useMemo(() => {
    const map = new Map<string, PatientRow>();
    appointments.forEach((a) => {
      const p = a.patient;
      if (!p?.id) return;
      const existing = map.get(p.id);
      if (existing) {
        existing.totalConsultas += 1;
      } else {
        map.set(p.id, {
          id: p.id,
          nome: p.nome,
          cpf: p.cpf,
          email: p.email,
          totalConsultas: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [appointments]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = removeAccents(searchQuery.toLowerCase());
    return patients.filter((p) => {
      const nome = removeAccents(p.nome.toLowerCase());
      const cpf = (p.cpf || "").replace(/\D/g, "");
      const qClean = q.replace(/\D/g, "");
      return nome.includes(q) || (qClean && cpf.includes(qClean));
    });
  }, [patients, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportMutation = useMutation({
    mutationFn: async (patientIds: string[]) => {
      if (patientIds.length === 1) {
        await reportsApi.enqueue({
          tipo_relatorio: "prontuario_paciente",
          parametros: { patient_id: patientIds[0] },
        });
        return;
      }

      await reportsApi.enqueue({
        tipo_relatorio: "prontuario_paciente",
        parametros: { patient_ids: patientIds },
      });
    },
    onSuccess: () => {
      toast.success("Exportação enviada para processamento. Acompanhe em Relatórios.");
      setSelectedIds(new Set());
    },
    onError: () => {
      toast.error("Erro ao solicitar exportação.");
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleExportSingle = (id: string) => {
    setSingleExportId(id);
    setExportTarget("single");
    setConfirmExport(true);
  };

  const handleExportBulk = () => {
    setExportTarget("bulk");
    setConfirmExport(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/doctor/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Pacientes</h1>
            <p className="text-sm text-muted-foreground">{patients.length} pacientes atendidos</p>
          </div>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={handleExportBulk} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Exportar {selectedIds.size} prontuário{selectedIds.size > 1 ? "s" : ""} (PDF)
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="shadow-card border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Lista de pacientes
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum paciente encontrado" description="Ajuste a busca ou aguarde novas consultas." />
          ) : (
            <>
               {/* Mobile card view */}
               <div className="space-y-2 sm:hidden max-h-[calc(100vh-18.5rem)] overflow-y-auto scroll-hidden pr-1">
                 {paginated.map((p) => (
                   <div
                     key={p.id}
                     className="flex items-center gap-3 rounded-xl border border-border/40 p-3"
                   >
                     <Checkbox
                       checked={selectedIds.has(p.id)}
                       onCheckedChange={() => toggleSelect(p.id)}
                       onClick={(e) => e.stopPropagation()}
                     />
                     <div
                       className="flex-1 min-w-0 cursor-pointer"
                       onClick={() => setRecordCtx({ patientId: p.id, patientName: p.nome })}
                     >
                       <p className="text-sm font-medium truncate">{p.nome}</p>
                       <p className="text-xs text-muted-foreground">{p.cpf || p.email}</p>
                     </div>
                     <div className="flex items-center gap-1 shrink-0">
                       <Badge variant="secondary" className="text-[10px]">{p.totalConsultas}</Badge>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleExportSingle(p.id)}
                         disabled={exportMutation.isPending}
                       >
                         <Download className="h-3.5 w-3.5" />
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Desktop table view */}
               <div className="hidden sm:block rounded-lg border border-border/40 max-h-[calc(100vh-20rem)] overflow-y-auto scroll-hidden">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-[40px] bg-card">
                        <Checkbox
                          checked={selectedIds.size === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="bg-card">Nome</TableHead>
                      <TableHead className="bg-card">CPF</TableHead>
                      <TableHead className="bg-card">Email</TableHead>
                      <TableHead className="text-center bg-card">Consultas</TableHead>
                      <TableHead className="text-right bg-card">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleSelect(p.id)}
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium"
                          onClick={() => setRecordCtx({ patientId: p.id, patientName: p.nome })}
                        >
                          {p.nome}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.cpf || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{p.totalConsultas}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecordCtx({ patientId: p.id, patientName: p.nome })}
                            >
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              Prontuário
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportSingle(p.id)}
                              disabled={exportMutation.isPending}
                            >
                              <Download className="mr-1 h-3.5 w-3.5" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Record Dialog */}
      {recordCtx && (
        <PatientRecordDialog
          open={Boolean(recordCtx)}
          patientId={recordCtx.patientId}
          patientName={recordCtx.patientName}
          onOpenChange={(o) => { if (!o) setRecordCtx(null); }}
        />
      )}

      {/* Confirm Export */}
      <ConfirmDialog
        open={confirmExport}
        onOpenChange={setConfirmExport}
        title="Exportar prontuário em PDF"
        description={
          exportTarget === "bulk"
            ? `Deseja exportar ${selectedIds.size} prontuário${selectedIds.size > 1 ? "s" : ""} em PDF? As tarefas serão enviadas para processamento em segundo plano.`
            : "Deseja exportar este prontuário em PDF? A tarefa será enviada para processamento em segundo plano."
        }
        confirmLabel="Exportar"
        onConfirm={() => {
          setConfirmExport(false);
          if (exportTarget === "bulk") {
            exportMutation.mutate(Array.from(selectedIds));
          } else if (singleExportId) {
            exportMutation.mutate([singleExportId]);
            setSingleExportId(null);
          }
        }}
      />
    </div>
  );
}
