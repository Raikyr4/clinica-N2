import { useState, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { medicalCertificatesApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileText, ChevronLeft, ChevronRight, Filter, Download, Calendar,
} from "lucide-react";
import { dayjs, formatDateTime } from "@/lib/date";
import {
  MedicalCertificateRequestStatus,
  MedicalCertificateRequestStatusLabel,
} from "@/types/api";
import type { MedicalCertificateRequest } from "@/types/api";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 15;

type StatusFilter = "todos" | "pendente" | "aprovado" | "rejeitado" | "gerado" | "enviado";

const statusColorMap: Record<MedicalCertificateRequestStatus, string> = {
  [MedicalCertificateRequestStatus.PENDENTE]: "outline",
  [MedicalCertificateRequestStatus.APROVADO]: "default",
  [MedicalCertificateRequestStatus.REJEITADO]: "destructive",
  [MedicalCertificateRequestStatus.GERADO]: "default",
  [MedicalCertificateRequestStatus.ENVIADO]: "secondary",
};

export default function PatientCertificateRequests() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [page, setPage] = useState(1);

  const referenceMonth = referenceDate.format("YYYY-MM");

  const handlePreviousMonth = () => {
    setReferenceDate((prev) => prev.subtract(1, "month"));
    setPage(1);
  };
  const handleNextMonth = () => {
    setReferenceDate((prev) => prev.add(1, "month"));
    setPage(1);
  };
  const handleToday = () => {
    setReferenceDate(dayjs());
    setPage(1);
  };

  const { data: requests = [], isLoading } = useQuery<MedicalCertificateRequest[]>({
    queryKey: ["medical-certificate-requests", "patient"],
    queryFn: async () => (await medicalCertificatesApi.listPatient()).data,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    const monthFiltered = requests.filter((r) => dayjs(r.requested_at).format("YYYY-MM") === referenceMonth);
    if (statusFilter === "todos") return monthFiltered;
    const statusMap: Record<string, MedicalCertificateRequestStatus> = {
      pendente: MedicalCertificateRequestStatus.PENDENTE,
      aprovado: MedicalCertificateRequestStatus.APROVADO,
      rejeitado: MedicalCertificateRequestStatus.REJEITADO,
      gerado: MedicalCertificateRequestStatus.GERADO,
      enviado: MedicalCertificateRequestStatus.ENVIADO,
    };
    return monthFiltered.filter((r) => r.status === statusMap[statusFilter]);
  }, [requests, statusFilter, referenceMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDownload = async (requestId: string) => {
    try {
      const { data } = await medicalCertificatesApi.download(requestId);
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atestado-${requestId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar o atestado.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Solicitações de Atestado</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe o status dos seus atestados médicos</p>
      </div>

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

      {/* Filter */}
      <Card className="shadow-card border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-[160px]">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Recusado</SelectItem>
              <SelectItem value="gerado">Gerado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
            </SelectContent>
            </Select>
            <Badge variant="outline" className="w-fit text-[11px]">
            <Calendar className="mr-1 h-3 w-3" />
            {referenceDate.format("MM/YYYY")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Atestados
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhuma solicitação" description="Você ainda não solicitou nenhum atestado médico." />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-2 sm:hidden">
                {paginated.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{r.doctor_nome || "—"}</p>
                      <Badge variant={statusColorMap[r.status] as any} className="text-xs shrink-0">
                        {MedicalCertificateRequestStatusLabel[r.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.requested_at)}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.motivo}</p>
                    {r.review_notes && (
                      <p className="text-xs text-muted-foreground/80 truncate">Obs: {r.review_notes}</p>
                    )}
                    {(r.status === MedicalCertificateRequestStatus.GERADO || r.status === MedicalCertificateRequestStatus.ENVIADO) && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(r.id)}>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{formatDateTime(r.requested_at)}</TableCell>
                        <TableCell className="text-sm font-medium">{r.doctor_nome || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{r.motivo}</TableCell>
                        <TableCell>
                          <Badge variant={statusColorMap[r.status] as any} className="text-xs">
                            {MedicalCertificateRequestStatusLabel[r.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.review_notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {(r.status === MedicalCertificateRequestStatus.GERADO || r.status === MedicalCertificateRequestStatus.ENVIADO) && (
                            <Button size="sm" variant="outline" onClick={() => handleDownload(r.id)}>
                              <Download className="mr-1 h-3.5 w-3.5" />
                              Baixar
                            </Button>
                          )}
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
    </div>
  );
}
