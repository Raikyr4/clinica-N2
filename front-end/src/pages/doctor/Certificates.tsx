import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicalCertificatesApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight, Clock,
  CheckCircle, XCircle, Download, RefreshCw,
} from "lucide-react";
import { dayjs, formatDateTime } from "@/lib/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MedicalCertificateRequestStatus,
  MedicalCertificateRequestStatusLabel,
} from "@/types/api";
import type { MedicalCertificateRequest } from "@/types/api";

const statusVariant: Record<MedicalCertificateRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [MedicalCertificateRequestStatus.PENDENTE]: "outline",
  [MedicalCertificateRequestStatus.APROVADO]: "secondary",
  [MedicalCertificateRequestStatus.REJEITADO]: "destructive",
  [MedicalCertificateRequestStatus.GERADO]: "default",
  [MedicalCertificateRequestStatus.ENVIADO]: "default",
};

const pageSizeOptions = [10, 25, 50];

export default function Certificates() {
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MedicalCertificateRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: allRequests = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctor-certificates-all"],
    queryFn: async () => {
      const { data } = await medicalCertificatesApi.listDoctor();
      return data;
    },
    refetchInterval: 8000,
    placeholderData: keepPreviousData,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, aprovar, observacoes }: { requestId: string; aprovar: boolean; observacoes?: string }) => {
      const { data } = await medicalCertificatesApi.review(requestId, { aprovar, observacoes });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.aprovar ? "Atestado aprovado!" : "Solicitação recusada.");
      queryClient.invalidateQueries({ queryKey: ["doctor-certificates-all"] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Falha ao avaliar solicitação.");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data } = await medicalCertificatesApi.download(requestId);
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atestado-${requestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Download iniciado."),
    onError: () => toast.error("Falha ao baixar atestado."),
  });

  const filtered = useMemo(() => {
    let list = [...allRequests];
    if (statusFilter !== "all") {
      const statusNum = Number(statusFilter);
      list = list.filter((r) => r.status === statusNum);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.patient_nome || "").toLowerCase().includes(q) ||
          r.motivo.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );
  }, [allRequests, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => { setCurrentPage(1); }, [pageSize, statusFilter, searchQuery]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const pendingCount = allRequests.filter((r) => r.status === MedicalCertificateRequestStatus.PENDENTE).length;

  const handleRefresh = async () => {
    if (isRefreshing || isFetching) return;
    setIsRefreshing(true);
    try { await refetch(); } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (isLoading && allRequests.length === 0) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-4.5rem)] overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Atestados e Declarações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie solicitações de atestados médicos e declarações.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-card border-border/60">
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Clock className="h-5 w-5 text-warning" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-[11px] text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <CheckCircle className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">
              {allRequests.filter((r) => r.status === MedicalCertificateRequestStatus.APROVADO || r.status === MedicalCertificateRequestStatus.GERADO || r.status === MedicalCertificateRequestStatus.ENVIADO).length}
            </p>
            <p className="text-[11px] text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <XCircle className="h-5 w-5 text-destructive" />
            <p className="text-2xl font-bold">
              {allRequests.filter((r) => r.status === MedicalCertificateRequestStatus.REJEITADO).length}
            </p>
            <p className="text-[11px] text-muted-foreground">Recusados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & controls */}
      <Card className="shadow-card border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente ou motivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={String(MedicalCertificateRequestStatus.PENDENTE)}>Pendentes</SelectItem>
                  <SelectItem value={String(MedicalCertificateRequestStatus.APROVADO)}>Aprovados</SelectItem>
                  <SelectItem value={String(MedicalCertificateRequestStatus.REJEITADO)}>Recusados</SelectItem>
                  <SelectItem value={String(MedicalCertificateRequestStatus.GERADO)}>Gerados</SelectItem>
                  <SelectItem value={String(MedicalCertificateRequestStatus.ENVIADO)}>Enviados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={isRefreshing || isFetching}>
                <RefreshCw className={cn("h-4 w-4", (isRefreshing || isFetching) && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paginated table */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Solicitações
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{filtered.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma solicitação"
              description="Não há solicitações de atestados para o filtro selecionado."
            />
          ) : (
            <div className="space-y-4">
              <div className="w-full overflow-x-auto overflow-y-auto rounded-lg border border-border/40 max-h-[40vh]">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="w-[160px]">Data</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((req) => (
                      <TableRow
                        key={req.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setSelectedRequest(req); setReviewNotes(""); }}
                      >
                        <TableCell className="font-medium text-sm">
                          {req.patient_nome || req.patient_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {req.motivo}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[req.status]} className="text-xs">
                            {MedicalCertificateRequestStatusLabel[req.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(req.requested_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(req.status === MedicalCertificateRequestStatus.GERADO || req.status === MedicalCertificateRequestStatus.ENVIADO) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); downloadMutation.mutate(req.id); }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-primary text-sm font-semibold text-primary-foreground">
                  {safePage}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => { if (!o) { setSelectedRequest(null); setReviewNotes(""); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da solicitação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Paciente</Label>
                    <p className="font-medium">{selectedRequest.patient_nome || selectedRequest.patient_id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={statusVariant[selectedRequest.status]}>
                        {MedicalCertificateRequestStatusLabel[selectedRequest.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Motivo</Label>
                  <p className="text-sm">{selectedRequest.motivo}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data da solicitação</Label>
                  <p className="text-sm">{formatDateTime(selectedRequest.requested_at)}</p>
                </div>
                {selectedRequest.review_notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Observações da avaliação</Label>
                    <p className="text-sm">{selectedRequest.review_notes}</p>
                  </div>
                )}

                {selectedRequest.status === MedicalCertificateRequestStatus.PENDENTE && (
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      placeholder="Adicione observações..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedRequest.status === MedicalCertificateRequestStatus.PENDENTE && (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => reviewMutation.mutate({ requestId: selectedRequest.id, aprovar: false, observacoes: reviewNotes || undefined })}
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Recusar
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => reviewMutation.mutate({ requestId: selectedRequest.id, aprovar: true, observacoes: reviewNotes || undefined })}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                    </Button>
                  </>
                )}
                {(selectedRequest.status === MedicalCertificateRequestStatus.GERADO || selectedRequest.status === MedicalCertificateRequestStatus.ENVIADO) && (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => downloadMutation.mutate(selectedRequest.id)}>
                    <Download className="mr-2 h-4 w-4" /> Baixar PDF
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
