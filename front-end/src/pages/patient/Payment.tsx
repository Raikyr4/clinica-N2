import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, paymentsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PaymentStatus } from "@/types/api";
import { toast } from "sonner";
import { CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/date";
export default function Payment() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [nsu, setNsu] = useState("");
  const [chargedValue, setChargedValue] = useState<number | null>(null);

  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data } = await appointmentsApi.list();
      return data;
    },
  });

  const appointment = (appointmentsData || []).find((a) => a.id === appointmentId);
  
  const doctorProfile = appointment?.doctor?.doctor_profile || null;

  const defaultValue =
    appointment?.slot?.valor_consulta !== undefined &&
    appointment?.slot?.valor_consulta !== null
      ? Number(appointment.slot.valor_consulta)
      : doctorProfile?.valor_padrao_consulta !== undefined &&
          doctorProfile?.valor_padrao_consulta !== null
        ? Number(doctorProfile.valor_padrao_consulta)
        : null;

  useEffect(() => {
    if (defaultValue !== null) {
      setChargedValue(Number(defaultValue));
    }
  }, [defaultValue]);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error("Appointment ID is required");

      const { data } = await paymentsApi.create({
        appointment_id: appointmentId,
        metodo: "CARTAO_FAKE",
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setPaymentSuccess(true);
      setNsu(data.nsu_fake || "N/A");
      setChargedValue(Number(data.valor));
      toast.success("Pagamento realizado com sucesso!");
    },
    onError: (error: unknown) => {
      const message =
        (typeof error === "object" && error && "response" in error &&
          (error as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
        (error instanceof Error ? error.message : null) ||
        "Erro ao processar pagamento";
      toast.error(message);
    },
  });

  if (isLoadingAppointments) {
    return (
      <div className="container mx-auto px-4 py-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (defaultValue === null || defaultValue <= 0) {
      toast.error("O médico ainda não definiu um valor para esta consulta.");
      return;
    }
    createPaymentMutation.mutate();
  };

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Consulta não encontrada</p>
              <Button onClick={() => navigate("/app/appointments")}>
                Voltar para consultas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-elevated border-success">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-success/10 p-4">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Pagamento Aprovado!</h2>
                <p className="text-muted-foreground">
                  Seu pagamento foi processado com sucesso.
                </p>
              </div>
              <Card className="w-full max-w-md bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NSU:</span>
                      <span className="font-mono font-medium">{nsu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(chargedValue ?? defaultValue ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={PaymentStatus.APROVADO} type="payment" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => navigate("/app/appointments")}
                  className="w-full sm:w-auto"
                >
                  Ver consultas
                </Button>
                <Button onClick={() => navigate("/app/dashboard")} className="w-full sm:w-auto">
                  Voltar ao início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app/appointments")}
        className="w-full sm:w-auto"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Detalhes da consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Médico</p>
              <p className="font-medium">{appointment.doctor?.nome || "Não informado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data e hora</p>
              <p className="font-medium">
                {appointment.slot?.inicio 
                  ? formatDateTime(appointment.slot.inicio)
                  : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">
                <StatusBadge status={appointment.status} type="appointment" />
              </div>
            </div>
            {doctorProfile?.especialidade && (
              <div>
                <p className="text-sm text-muted-foreground">Especialidade</p>
                <p className="font-medium">
                  {doctorProfile.especialidade}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Realizar pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Valor da consulta</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total a pagar</p>
                  <p className="text-2xl font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(defaultValue ?? 0)}
                  </p>
                </div>
                {(defaultValue === null || defaultValue <= 0) && (
                  <p className="text-sm text-destructive">
                    O médico ainda não definiu um valor para esta consulta. Aguarde ou entre em contato com a clínica.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Método de pagamento</Label>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-xs text-muted-foreground">
                        Pagamento simulado (sempre aprovado)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  createPaymentMutation.isPending ||
                  defaultValue === null ||
                  defaultValue <= 0
                }
              >
                {createPaymentMutation.isPending ? (
                  "Processando..."
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(chargedValue ?? defaultValue ?? 0)}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
