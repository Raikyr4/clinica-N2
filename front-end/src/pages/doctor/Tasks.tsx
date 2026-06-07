import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicalCertificatesApi, reportsApi } from "@/api/endpoints";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ChevronLeft, ChevronRight, FileDown, FileText, RefreshCw, Repeat, Trash2, XCircle } from "lucide-react";
import { dayjs, formatDateTime } from "@/lib/date";
import { ReportQueueStatus, ReportQueueStatusLabel } from "@/types/api";
import type { MedicalCertificateRequest, ReportQueueItem } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";

function downloadBlob(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

const statusVariant: Record<ReportQueueStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [ReportQueueStatus.PENDENTE]: "outline",
  [ReportQueueStatus.PROCESSANDO]: "secondary",
  [ReportQueueStatus.CONCLUIDO]: "default",
  [ReportQueueStatus.ERRO]: "destructive",
  [ReportQueueStatus.CANCELADO]: "outline",
};

const statusStyles: Record<
  ReportQueueStatus,
  { badgeClassName?: string; progressIndicatorClassName?: string; progressTextClassName?: string }
> = {
  [ReportQueueStatus.PENDENTE]: {},
  [ReportQueueStatus.PROCESSANDO]: {
    progressIndicatorClassName: "bg-blue-500 dark:bg-blue-400",
    progressTextClassName: "text-blue-700 dark:text-blue-100",
  },
  [ReportQueueStatus.CONCLUIDO]: {
    badgeClassName:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200",
  },
  [ReportQueueStatus.ERRO]: {},
  [ReportQueueStatus.CANCELADO]: {
    badgeClassName:
      "border-red-500/50 bg-red-500/10 text-red-600 dark:border-red-400/50 dark:bg-red-500/20 dark:text-red-200",
  },
};

const pageSizeOptions = [10, 25, 50];

export default function DoctorTasks() {
  const queryClient = useQueryClient();
  const { referenceMonth, setReferenceMonth } = useDashboardPeriodStore();
  const [items, setItems] = useState<ReportQueueItem[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    if (typeof window === "undefined") {
      return dayjs(`${referenceMonth}-01`).format("YYYY-MM-DD");
    }

    return (
      window.sessionStorage.getItem("tasks.startDate") ??
      dayjs(`${referenceMonth}-01`).format("YYYY-MM-DD")
    );
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: certificatePending = [] } = useQuery({
    queryKey: ["doctor-certificate-pending"],
    queryFn: async () => {
      const { data } = await medicalCertificatesApi.listDoctorPending();
      return data;
    },
    refetchInterval: 8000,
  });

  const reviewCertificateMutation = useMutation({
    mutationFn: async ({ requestId, aprovar, observacoes }: { requestId: string; aprovar: boolean; observacoes?: string }) => {
      const { data } = await medicalCertificatesApi.review(requestId, { aprovar, observacoes });
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.aprovar ? "Atestado aprovado e enviado para geração." : "Solicitação recusada.");
      queryClient.invalidateQueries({ queryKey: ["doctor-certificate-pending"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-report-queue"] });
      setReviewNotes((prev) => ({ ...prev, [variables.requestId]: "" }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Falha ao avaliar solicitação.");
    },
  });

  const { data: initialItems, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["doctor-report-queue"],
    queryFn: async () => {
      const { data: response } = await reportsApi.queue();
      return response;
    },
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("tasks.startDate", startDate);
    }
  }, [startDate]);

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => reportsApi.cancelReport(id),
    onSuccess: () => {
      toast.success("Relatório cancelado.");
      queryClient.invalidateQueries({ queryKey: ["doctor-report-queue"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || error.message || "Falha ao cancelar relatório.";
      toast.error(message);
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (id: string) => reportsApi.reissueReport(id),
    onSuccess: () => {
      toast.success("Relatório reemitido.");
      queryClient.invalidateQueries({ queryKey: ["doctor-report-queue"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || error.message || "Falha ao reemitir relatório.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => reportsApi.deleteReport(id),
    onSuccess: () => {
      toast.success("Relatório removido.");
      queryClient.invalidateQueries({ queryKey: ["doctor-report-queue"] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || error.message || "Falha ao remover o relatório.";
      toast.error(message);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (item: ReportQueueItem) => {
      const { data } = await reportsApi.downloadReport(item.id);
      const fileName = item.file_ref || `${item.tipo_relatorio.toLowerCase()}-${item.id}.pdf`;
      downloadBlob(data, fileName);
    },
    onSuccess: () => {
      toast.success("Download iniciado.");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || error.message || "Falha ao baixar o relatório.";
      toast.error(message);
    },
  });

  const filteredItems = useMemo(() => {
    const data = items ?? [];
    const referenceDate = startDate ? dayjs(startDate).startOf("day") : null;

    return data.filter((item) => {
      if (!referenceDate) return true;
      const requestedAt = dayjs(item.solicitado_em);
      return !requestedAt.isBefore(referenceDate, "day");
    });
  }, [items, startDate]);

  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) =>
          new Date(b.solicitado_em).getTime() -
          new Date(a.solicitado_em).getTime()
      ),
    [filteredItems]
  );

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, startDate, items.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.slice(start, end);
  }, [pageSize, safePage, sortedItems]);

  const canCancel =
    (status: ReportQueueStatus) =>
      status === ReportQueueStatus.PENDENTE || status === ReportQueueStatus.PROCESSANDO;

  const handleRefresh = async () => {
    if (isRefreshing || isFetching) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value) {
      setReferenceMonth(dayjs(value).format("YYYY-MM"));
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-5rem)] overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold text-primary">Relatórios</h1>
      </div>

      <Card className="shadow-card">
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing || isFetching}
                title="Atualizar lista"
              >
                <RefreshCw className={cn("h-4 w-4", (isRefreshing || isFetching) && "animate-spin")} />
                <span className="sr-only">Atualizar</span>
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium text-primary">Exibir tarefas a partir de</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                  className="w-full min-w-[160px] sm:w-[160px]"
                />
              </div>
            </div>
          </div>


          {sortedItems.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={FileText}
                title="Nenhuma tarefa encontrada"
                description="Não há relatórios em fila para o filtro selecionado."
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-full overflow-x-auto overflow-y-auto max-h-[45vh]">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[200px]">Data</TableHead>
                      <TableHead className="w-[180px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => {
                      const isDownloadable = item.status === ReportQueueStatus.CONCLUIDO;
                      const isCancelable = canCancel(item.status);
                      const progressValue =
                        item.status === ReportQueueStatus.CONCLUIDO ? 100 : item.progress_percent ?? 0;
                      const showProgress =
                        item.status === ReportQueueStatus.PENDENTE ||
                        item.status === ReportQueueStatus.PROCESSANDO;
                      const statusStyle = statusStyles[item.status];
                      const canDelete =
                        item.status === ReportQueueStatus.CONCLUIDO ||
                        item.status === ReportQueueStatus.CANCELADO;

                      const description = item.tipo_relatorio
                        ? item.tipo_relatorio.replaceAll("_", " ")
                        : "Relatório";

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {showProgress ? (
                              <div className="space-y-2">
                                <Progress
                                  value={progressValue}
                                  className="h-2"
                                  indicatorClassName={statusStyle.progressIndicatorClassName}
                                />
                                <span className={cn("text-xs text-muted-foreground", statusStyle.progressTextClassName)}>
                                  {progressValue}%
                                </span>
                              </div>
                            ) : (
                              <Badge
                                variant={statusVariant[item.status]}
                                className={statusStyle.badgeClassName}
                              >
                                {ReportQueueStatusLabel[item.status]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{description}</TableCell>
                          <TableCell>{formatDateTime(item.solicitado_em)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn("h-9 w-9 rounded-full", isDownloadable && "text-emerald-600")}
                                onClick={() => downloadMutation.mutate(item)}
                                disabled={!isDownloadable || downloadMutation.isPending}
                                title="Baixar PDF"
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-full text-primary"
                                onClick={() => reissueMutation.mutate(item.id)}
                                disabled={reissueMutation.isPending}
                                title="Emitir novamente"
                              >
                                <Repeat className="h-4 w-4" />
                              </Button>
                              {isCancelable ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-full text-destructive"
                                  onClick={() => cancelMutation.mutate(item.id)}
                                  disabled={cancelMutation.isPending}
                                  title="Cancelar"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-full text-destructive"
                                  onClick={() => deleteMutation.mutate(item.id)}
                                  disabled={!canDelete || deleteMutation.isPending}
                                  title="Apagar tarefa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
