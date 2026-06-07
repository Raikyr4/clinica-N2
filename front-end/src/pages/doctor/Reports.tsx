import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorApi, reportsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { dayjs } from "@/lib/date";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";
import {
  Download, Loader2, FileText, BarChart3, Users, DollarSign,
  Calendar, TrendingUp, ClipboardList, ArrowRight, FilePieChart,
  Clock, RefreshCw,
} from "lucide-react";
import { ReportQueueStatus, ReportQueueStatusLabel } from "@/types/api";

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

type ReportDecor = { icon: any; accent: string; badge: string; description: string };

const reportDecorMap: Record<string, ReportDecor> = {
  DOCTOR_SUMMARY: { icon: BarChart3, accent: "bg-primary/10 text-primary", badge: "Resumo", description: "Visão geral do período selecionado" },
  FINANCIAL_REPORT: { icon: DollarSign, accent: "bg-secondary/10 text-secondary", badge: "Financeiro", description: "Receitas, pagamentos e projeções" },
  PATIENT_LIST: { icon: Users, accent: "bg-accent/20 text-accent-foreground", badge: "Pacientes", description: "Lista detalhada de pacientes atendidos" },
  APPOINTMENT_HISTORY: { icon: Calendar, accent: "bg-warning/10 text-warning", badge: "Agenda", description: "Histórico completo de consultas" },
  OCCUPANCY_REPORT: { icon: TrendingUp, accent: "bg-primary/10 text-primary", badge: "Ocupação", description: "Taxa de ocupação e aproveitamento" },
  PAYMENT_RECEIPT: { icon: ClipboardList, accent: "bg-secondary/10 text-secondary", badge: "Recibos", description: "Comprovantes de pagamento emitidos" },
};

const statusColors: Record<number, string> = {
  [ReportQueueStatus.PENDENTE]: "bg-muted text-muted-foreground",
  [ReportQueueStatus.PROCESSANDO]: "bg-warning/10 text-warning",
  [ReportQueueStatus.CONCLUIDO]: "bg-primary/10 text-primary",
  [ReportQueueStatus.ERRO]: "bg-destructive/10 text-destructive",
  [ReportQueueStatus.CANCELADO]: "bg-muted text-muted-foreground",
};

export default function DoctorReports() {
  const queryClient = useQueryClient();
  const { referenceMonth, setReferenceMonth } = useDashboardPeriodStore();
  const [startDate, setStartDate] = useState(() => dayjs(`${referenceMonth}-01`).format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(() => dayjs(`${referenceMonth}-01`).endOf("month").format("YYYY-MM-DD"));
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["doctor-report-catalog"],
    queryFn: async () => (await doctorApi.getReportsCatalog()).data,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["doctor-report-queue"],
    queryFn: async () => (await reportsApi.queue()).data,
    refetchInterval: 5000,
  });

  const enqueueMutation = useMutation({
    mutationFn: async (reportKey: string) => {
      setPendingKey(reportKey);
      return doctorApi.generateReport(reportKey, { startDate: startDate || undefined, endDate: endDate || undefined });
    },
    onSuccess: () => {
      toast.success("Relatório enviado para processamento.");
      setPendingKey(null);
      queryClient.invalidateQueries({ queryKey: ["doctor-report-queue"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Falha ao emitir relatório.");
      setPendingKey(null);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await doctorApi.downloadReportJob(jobId);
      const job = jobs.find((item) => item.id === jobId);
      downloadBlob(data, job?.file_ref || `report-${jobId}.pdf`);
    },
    onSuccess: () => toast.success("Download iniciado."),
    onError: (error: any) => toast.error(error.response?.data?.detail || "Falha ao baixar relatório."),
  });

  const recentJobs = useMemo(() => jobs.slice(0, 8), [jobs]);

  const visibleCatalog = useMemo(
    () => catalog.filter((report) => report.report_key !== "MEDICAL_CERTIFICATE"),
    [catalog]
  );

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (value) setReferenceMonth(dayjs(value).format("YYYY-MM"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FilePieChart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Emita e acompanhe seus relatórios médicos.</p>
        </div>
      </div>

      {/* Date range filter */}
      <Card className="shadow-card border-border/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Início</label>
            <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Fim</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Report catalog */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando catálogo de relatórios...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCatalog.map((report) => {
            const isPending = pendingKey === report.report_key && enqueueMutation.isPending;
            const decor = reportDecorMap[report.report_key] || { icon: FileText, accent: "bg-muted text-foreground", badge: "Relatório", description: "" };
            const Icon = decor.icon;
            return (
              <Card key={report.report_key} className="shadow-card border-border/60 transition-all hover:shadow-elevated hover:-translate-y-0.5 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${decor.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-[10px] mb-1.5">{decor.badge}</Badge>
                      <CardTitle className="text-base leading-tight">{report.nome}</CardTitle>
                      <CardDescription className="mt-1 text-xs leading-relaxed">{report.descricao || decor.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button
                    className="w-full"
                    onClick={() => enqueueMutation.mutate(report.report_key)}
                    disabled={enqueueMutation.isPending}
                  >
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Emitindo...</> : <>Emitir relatório <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent jobs */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Últimas emissões
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">{recentJobs.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum relatório emitido ainda.</p>
          ) : <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">{recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3 transition-all hover:bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusColors[job.status] || "bg-muted"}`}>
                  {job.status === ReportQueueStatus.PROCESSANDO ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : job.status === ReportQueueStatus.CONCLUIDO ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{job.tipo_relatorio.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(job.solicitado_em).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">{ReportQueueStatusLabel[job.status as ReportQueueStatus]}</Badge>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={job.status !== ReportQueueStatus.CONCLUIDO || downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate(job.id)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
