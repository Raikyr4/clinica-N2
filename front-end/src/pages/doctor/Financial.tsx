import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";
import { doctorApi, appointmentsApi, paymentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { dayjs, formatDate, formatDateTime } from "@/lib/date";
import {
  DollarSign, TrendingUp, CreditCard, AlertTriangle, Wallet,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight,
  Download, FileText, Search, Filter,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import type { FinancialInsights, Payment, Appointment } from "@/types/api";
import { PaymentStatus, PaymentStatusLabel, AppointmentStatus } from "@/types/api";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CHART_COLORS = [
  "hsl(210, 85%, 55%)",
  "hsl(145, 60%, 45%)",
  "hsl(24, 92%, 58%)",
  "hsl(38, 85%, 55%)",
  "hsl(0, 75%, 50%)",
  "hsl(280, 60%, 55%)",
];

type ChartGranularity = "diario" | "semanal";
type TxFilter = "todos" | "pendente" | "estornado" | "pix" | "cartao" | "hoje" | "7dias";

const getPaymentDate = (payment: Payment) => payment.data_pagamento || payment.created_at;

export default function DoctorFinancial() {
  const { referenceMonth, setReferenceMonth } = useDashboardPeriodStore();
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>("diario");
  const [txFilter, setTxFilter] = useState<TxFilter>("todos");
  const [txSearch, setTxSearch] = useState("");

  const handleNavigateMonth = (offset: number) => {
    setReferenceMonth(dayjs(referenceMonth).add(offset, "month").format("YYYY-MM"));
  };

  const { data, isLoading } = useQuery<FinancialInsights>({
    queryKey: ["doctor-financial", referenceMonth],
    queryFn: async () => (await doctorApi.getFinancial(referenceMonth)).data,
    placeholderData: keepPreviousData,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["doctor-payments-fin", referenceMonth],
    queryFn: async () => (await paymentsApi.list(0, 500)).data,
    placeholderData: keepPreviousData,
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["doctor-appointments-fin", referenceMonth],
    queryFn: async () => (await appointmentsApi.list(0, 500, referenceMonth)).data,
    placeholderData: keepPreviousData,
  });

  const doctorAppointmentIds = useMemo(() => new Set(appointments.map((a) => a.id)), [appointments]);
  const monthStart = dayjs(`${referenceMonth}-01`);
  const monthEnd = monthStart.endOf("month");

  const relevantPayments = useMemo(() =>
    payments.filter((p) => doctorAppointmentIds.has(p.appointment_id)),
    [payments, doctorAppointmentIds]
  );

  const monthPayments = useMemo(() =>
    relevantPayments.filter((p) => {
      const d = dayjs(getPaymentDate(p));
      return !d.isBefore(monthStart) && !d.isAfter(monthEnd);
    }),
    [relevantPayments, monthStart, monthEnd]
  );

  // Revenue chart
  const dailyRevenue = useMemo(() => {
    const daysInMonth = monthStart.daysInMonth();
    const dailyMap = new Map<string, { valor: number; count: number }>();

    monthPayments
      .filter((p) => p.status === PaymentStatus.APROVADO)
      .forEach((p) => {
        const key = dayjs(getPaymentDate(p)).format("DD");
        const cur = dailyMap.get(key) || { valor: 0, count: 0 };
        cur.valor += p.valor;
        cur.count += 1;
        dailyMap.set(key, cur);
      });

    if (chartGranularity === "semanal") {
      const weeks: { dia: string; valor: number; count: number }[] = [];
      for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
        let total = 0, cnt = 0;
        for (let d = w * 7 + 1; d <= Math.min((w + 1) * 7, daysInMonth); d++) {
          const key = String(d).padStart(2, "0");
          const v = dailyMap.get(key);
          if (v) { total += v.valor; cnt += v.count; }
        }
        weeks.push({ dia: `Sem ${w + 1}`, valor: total, count: cnt });
      }
      return weeks;
    }

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      const v = dailyMap.get(day) || { valor: 0, count: 0 };
      return { dia: day, valor: v.valor, count: v.count };
    });
  }, [monthPayments, chartGranularity, monthStart]);

  const avgDaily = useMemo(() => {
    const total = dailyRevenue.reduce((s, d) => s + d.valor, 0);
    return total / (dailyRevenue.length || 1);
  }, [dailyRevenue]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const methodMap = new Map<string, number>();
    monthPayments
      .filter((p) => p.status === PaymentStatus.APROVADO)
      .forEach((p) => {
        const label = p.metodo === "PIX" ? "PIX" : p.metodo === "DINHEIRO" ? "Dinheiro" : "Cartão";
        methodMap.set(label, (methodMap.get(label) || 0) + p.valor);
      });
    const total = Array.from(methodMap.values()).reduce((s, v) => s + v, 0);
    return Array.from(methodMap.entries()).map(([name, value]) => ({
      name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [monthPayments]);

  // Status distribution (appointments + payment status)
  const statusDistribution = useMemo(() => {
    const paidApptIds = new Set(monthPayments.filter((p) => p.status === PaymentStatus.APROVADO).map((p) => p.appointment_id));
    const refundedApptIds = new Set(monthPayments.filter((p) => p.status === PaymentStatus.ESTORNADO).map((p) => p.appointment_id));

    const dist = [
      { label: "Realizadas pagas", count: 0, valor: 0, color: CHART_COLORS[1] },
      { label: "Realizadas pendentes", count: 0, valor: 0, color: CHART_COLORS[3] },
      { label: "Agendadas", count: 0, valor: 0, color: CHART_COLORS[0] },
      { label: "Canceladas c/ estorno", count: 0, valor: 0, color: CHART_COLORS[4] },
      { label: "Canceladas s/ estorno", count: 0, valor: 0, color: CHART_COLORS[2] },
    ];

    appointments.forEach((a) => {
      if (a.status === AppointmentStatus.REALIZADA) {
        if (paidApptIds.has(a.id)) dist[0].count++;
        else dist[1].count++;
      } else if (a.status === AppointmentStatus.AGENDADA) {
        dist[2].count++;
      } else if (a.status === AppointmentStatus.CANCELADA) {
        if (refundedApptIds.has(a.id)) dist[3].count++;
        else dist[4].count++;
      }
    });

    return dist.filter((d) => d.count > 0);
  }, [appointments, monthPayments]);

  // Transactions base for period + filtered table
  const baseTransactions = useMemo(() => {
    const payMap = new Map<string, Payment>();
    monthPayments.forEach((payment) => payMap.set(payment.appointment_id, payment));

    return appointments
      .map((appointment) => {
        const payment = payMap.get(appointment.id);
        return {
          id: appointment.id,
          date: appointment.slot?.inicio || appointment.created_at,
          patient: appointment.patient?.nome || "Paciente",
          status: payment ? payment.status : null,
          statusLabel: payment ? PaymentStatusLabel[payment.status] : "Pendente",
          method: payment?.metodo || null,
          valor: payment?.valor || 0,
          appointmentStatus: appointment.status,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, monthPayments]);

  const transactions = useMemo(() => {
    let rows = [...baseTransactions];

    // Apply filters
    if (txFilter === "pendente") rows = rows.filter((r) => r.status === null);
    if (txFilter === "estornado") rows = rows.filter((r) => r.status === PaymentStatus.ESTORNADO);
    if (txFilter === "pix") rows = rows.filter((r) => r.method === "PIX");
    if (txFilter === "cartao") rows = rows.filter((r) => r.method === "CARTAO_FAKE");
    if (txFilter === "hoje") rows = rows.filter((r) => dayjs(r.date).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD"));
    if (txFilter === "7dias") rows = rows.filter((r) => dayjs(r.date).isAfter(dayjs().subtract(7, "day")));

    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      rows = rows.filter((r) => r.patient.toLowerCase().includes(q));
    }

    return rows;
  }, [baseTransactions, txFilter, txSearch]);

  const pendingTransactions = useMemo(() =>
    baseTransactions.filter((tx) => tx.appointmentStatus !== AppointmentStatus.CANCELADA && tx.status === null),
    [baseTransactions]
  );

  // Receivables aging
  const aging = useMemo(() => {
    const now = dayjs();
    const bins = [
      { label: "0–7 dias", count: 0, valor: 0 },
      { label: "8–30 dias", count: 0, valor: 0 },
      { label: "30+ dias", count: 0, valor: 0 },
    ];

    pendingTransactions
      .filter((tx) => tx.appointmentStatus === AppointmentStatus.REALIZADA)
      .forEach((tx) => {
        const diff = now.diff(dayjs(tx.date), "day");
        if (diff <= 7) bins[0].count++;
        else if (diff <= 30) bins[1].count++;
        else bins[2].count++;
      });

    return bins;
  }, [pendingTransactions]);

  // Gross revenue calculation
  const grossRevenue = useMemo(() =>
    monthPayments.filter((p) => p.status === PaymentStatus.APROVADO).reduce((s, p) => s + p.valor, 0),
    [monthPayments]
  );

  const refunds = useMemo(() => {
    const items = monthPayments.filter((p) => p.status === PaymentStatus.ESTORNADO);
    return { total: items.reduce((s, p) => s + p.valor, 0), count: items.length };
  }, [monthPayments]);

  const monthLabel = dayjs(`${referenceMonth}-01`).format("MMMM [de] YYYY");
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const hasFinancialData = Boolean(data) || payments.length > 0 || appointments.length > 0;
  if (isLoading && !hasFinancialData) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Painel decisório — {capitalizedMonth}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleNavigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="month" className="w-[200px]" value={referenceMonth} onChange={(e) => setReferenceMonth(e.target.value)} />
          <Button variant="outline" size="icon" onClick={() => handleNavigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FinKpi icon={DollarSign} label="Receita recebida" value={fmt(data?.receita_recebida ?? 0)} sub={capitalizedMonth} accent="secondary" />
        <FinKpi icon={TrendingUp} label="Receita bruta" value={fmt(grossRevenue)} sub={capitalizedMonth} accent="primary" />
        <FinKpi icon={CreditCard} label="Ticket médio" value={fmt(data?.ticket_medio ?? 0)} sub={`${data?.consultas_com_pagamento ?? 0} pagas`} accent="primary" />
        <FinKpi icon={Wallet} label="A receber" value={fmt(data?.receita_prevista ?? 0)} sub={`${data?.consultas_sem_pagamento ?? 0} consultas`} accent="warning" />
        <FinKpi icon={AlertTriangle} label="Estornos" value={fmt(refunds.total)} sub={`${refunds.count} estorno${refunds.count !== 1 ? "s" : ""}`} accent="destructive" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Area chart */}
        <Card className="shadow-card border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Receita por {chartGranularity === "diario" ? "dia" : "semana"}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Média: {fmt(avgDaily)}</span>
                <Select value={chartGranularity} onValueChange={(v) => setChartGranularity(v as ChartGranularity)}>
                  <SelectTrigger className="h-8 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] px-2 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 22%)" strokeOpacity={0.3} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "hsl(215, 15%, 60%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 60%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(215, 20%, 88%)", borderRadius: 8 }}
                  formatter={(value: number, _name: string, props: any) => [
                    `${fmt(value)} · ${props.payload.count || 0} consulta${props.payload.count !== 1 ? "s" : ""}`,
                    "Receita",
                  ]}
                />
                <Area type="monotone" dataKey="valor" stroke="hsl(145, 60%, 45%)" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {paymentBreakdown.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Sem dados de pagamento</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name">
                    {paymentBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${fmt(value)}`, name]} contentStyle={{ borderRadius: 8 }} />
                  <Legend formatter={(value, entry: any) => {
                    const item = paymentBreakdown.find((b) => b.name === value);
                    return `${value} ${item ? `(${item.pct}%)` : ""}`;
                  }} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status distribution - improved with bar chart */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição de consultas</CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Sem dados para o período.</p>
          ) : (
            <div className="space-y-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      formatter={(value: number) => [`${value} consulta${value !== 1 ? "s" : ""}`, "Total"]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                      {statusDistribution.map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {statusDistribution.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border/40 p-2.5">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{item.count}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receivables Aging */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {aging.map((bin, i) => (
          <Card key={bin.label} className={`shadow-card border-border/60 ${i === 2 && bin.count > 0 ? "border-destructive/30" : ""}`}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{bin.label}</p>
              <p className="text-2xl font-bold mt-1">{bin.count}</p>
              <p className="text-xs text-muted-foreground">pendente{bin.count !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unified financial bottom section */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Detalhamento financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={txFilter} onValueChange={(v) => setTxFilter(v as TxFilter)}>
              <SelectTrigger className="h-9 w-full sm:w-[130px]">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="estornado">Estornado</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="7dias">7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Two columns: Transactions + Pending in sub-cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3 border-border/40 shadow-none bg-muted/20">
              <CardContent className="p-3 sm:p-4">
                <TransactionsTable transactions={transactions} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 border-border/40 shadow-none bg-muted/20">
              <CardContent className="p-3 sm:p-4">
                <PendingPaymentsList pendingTransactions={pendingTransactions} />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TX_PER_PAGE = 15;

function TransactionsTable({ transactions }: { transactions: Array<{ id: string; date: string; patient: string; status: number | null; statusLabel: string; method: string | null; valor: number; appointmentStatus: number }> }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(transactions.length / TX_PER_PAGE);
  const paginated = transactions.slice((page - 1) * TX_PER_PAGE, page * TX_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Movimentações do período
        </h3>
        <Badge variant="secondary" className="text-xs">{transactions.length} registros</Badge>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma movimentação" description="Sem registros para o filtro selecionado." />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-2 sm:hidden max-h-[400px] overflow-y-auto">
            {paginated.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{tx.patient}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-sm font-medium">{tx.valor > 0 ? fmt(tx.valor) : "—"}</p>
                  <Badge variant={tx.status === PaymentStatus.APROVADO ? "default" : tx.status === PaymentStatus.ESTORNADO ? "destructive" : "outline"} className="text-[10px]">
                    {tx.statusLabel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block rounded-lg border border-border/40 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.patient}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === PaymentStatus.APROVADO ? "default" : tx.status === PaymentStatus.ESTORNADO ? "destructive" : "outline"} className="text-xs">
                        {tx.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{tx.method === "PIX" ? "PIX" : tx.method === "DINHEIRO" ? "Dinheiro" : tx.method ? "Cartão" : "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{tx.valor > 0 ? fmt(tx.valor) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
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
    </div>
  );
}


const PENDING_PER_PAGE = 15;

type PendingTransaction = {
  id: string;
  date: string;
  patient: string;
};

function PendingPaymentsList({ pendingTransactions }: { pendingTransactions: PendingTransaction[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(pendingTransactions.length / PENDING_PER_PAGE));
  const paginated = pendingTransactions.slice((page - 1) * PENDING_PER_PAGE, page * PENDING_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Pagamentos pendentes
        </h3>
        <Badge variant="outline" className="text-xs">{pendingTransactions.length}</Badge>
      </div>
      {pendingTransactions.length === 0 ? (
        <EmptyState icon={FileText} title="Tudo em dia!" description="Nenhum pagamento pendente no período." />
      ) : (
        <>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {paginated.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{tx.patient}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0 ml-2">Pendente</Badge>
              </div>
            ))}
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
    </div>
  );
}

function FinKpi({ icon: Icon, label, value, sub, accent }: {
  icon: typeof DollarSign; label: string; value: string; sub?: string;
  accent: "primary" | "secondary" | "warning" | "destructive";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="shadow-card border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
        {sub && <p className="truncate text-[11px] text-muted-foreground/70">{sub}</p>}
      </CardContent>
    </Card>
  );
}
