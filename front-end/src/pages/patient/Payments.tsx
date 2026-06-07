import { useState, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  CreditCard, Search, ChevronLeft, ChevronRight, Filter, Calendar,
} from "lucide-react";
import { dayjs, formatDateTime } from "@/lib/date";
import type { Payment } from "@/types/api";
import { PaymentStatus } from "@/types/api";

const ITEMS_PER_PAGE = 15;

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type StatusFilter = "todos" | "aprovado" | "negado" | "estornado";

export default function PatientPayments() {
  const [search, setSearch] = useState("");
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

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["patient-all-payments"],
    queryFn: async () => (await paymentsApi.list(0, 500)).data,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    let result = payments;
    if (statusFilter !== "todos") {
      const statusMap: Record<string, PaymentStatus> = {
        aprovado: PaymentStatus.APROVADO,
        negado: PaymentStatus.NEGADO,
        estornado: PaymentStatus.ESTORNADO,
      };
      result = result.filter((p) => p.status === statusMap[statusFilter]);
    }
    result = result.filter((p) => {
      const refDate = p.data_pagamento || p.created_at;
      return dayjs(refDate).format("YYYY-MM") === referenceMonth;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.appointment?.doctor?.nome?.toLowerCase().includes(q) ||
        p.metodo?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, statusFilter, search, referenceMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const summary = useMemo(() => {
    const approved = payments.filter((p) => p.status === PaymentStatus.APROVADO);
    const refunded = payments.filter((p) => p.status === PaymentStatus.ESTORNADO);
    return {
      total: approved.reduce((s, p) => s + p.valor, 0),
      count: approved.length,
      refundedTotal: refunded.reduce((s, p) => s + p.valor, 0),
      refundedCount: refunded.length,
    };
  }, [payments]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Meus Pagamentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Histórico completo de pagamentos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Estornos</p>
            <p className="text-lg font-bold text-destructive">{fmt(summary.refundedTotal)}</p>
            <p className="text-[11px] text-muted-foreground">{summary.refundedCount} estorno{summary.refundedCount !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total registros</p>
            <p className="text-lg font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Filtrados</p>
            <p className="text-lg font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

      <Card className="shadow-card border-border/60">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por médico ou método..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-[140px]">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="negado">Negado</SelectItem>
                <SelectItem value="estornado">Estornado</SelectItem>
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
              <CreditCard className="h-4 w-4 text-primary" />
              Pagamentos
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={CreditCard} title="Nenhum pagamento encontrado" description="Ajuste os filtros ou realize uma consulta." />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-2 sm:hidden">
                {paginated.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.appointment?.doctor?.nome || "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.data_pagamento || p.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{p.metodo === "PIX" ? "PIX" : p.metodo === "DINHEIRO" ? "Dinheiro" : "Cartão"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="text-sm font-medium">{fmt(p.valor)}</p>
                      <StatusBadge status={p.status} type="payment" />
                    </div>
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
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDateTime(p.data_pagamento || p.created_at)}</TableCell>
                        <TableCell className="text-sm font-medium">{p.appointment?.doctor?.nome || "—"}</TableCell>
                        <TableCell className="text-sm">{p.metodo === "PIX" ? "PIX" : p.metodo === "DINHEIRO" ? "Dinheiro" : "Cartão"}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} type="payment" />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(p.valor)}</TableCell>
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
