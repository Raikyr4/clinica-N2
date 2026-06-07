import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsApi } from "@/api/endpoints";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import type { PatientRecord, PatientRecordNote } from "@/types/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PatientRecordDialogProps {
  patientId: string;
  patientName?: string;
  appointmentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PatientRecordDialog({
  patientId,
  patientName,
  appointmentId,
  open,
  onOpenChange,
}: PatientRecordDialogProps) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const {
    data: record,
    isLoading: isLoadingRecord,
    isFetching: isFetchingRecord,
    error: recordError,
  } = useQuery<PatientRecord>({
    queryKey: ["patient-record", patientId],
    queryFn: async () => {
      const { data } = await medicalRecordsApi.getPatientRecord(patientId);
      return data;
    },
    enabled: open && Boolean(patientId),
  });

  const {
    data: notes,
    isLoading: isLoadingNotes,
    error: notesError,
  } = useQuery<PatientRecordNote[]>({
    queryKey: ["patient-record-notes", patientId],
    queryFn: async () => {
      const { data } = await medicalRecordsApi.getPatientNotes(patientId);
      return data;
    },
    enabled: open && Boolean(patientId),
  });

  const addNoteMutation = useMutation({
    mutationFn: async (observacao: string) => {
      const payload: { observacao: string; appointment_id?: string } = {
        observacao,
      };
      if (appointmentId) {
        payload.appointment_id = appointmentId;
      }
      const { data } = await medicalRecordsApi.addNote(patientId, payload);
      return data;
    },
    onSuccess: (newNote) => {
      toast.success("Observação adicionada ao prontuário");
      setNoteText("");
      queryClient.setQueryData<PatientRecordNote[] | undefined>(
        ["patient-record-notes", patientId],
        (existing) => (existing ? [newNote, ...existing] : [newNote])
      );
    },
    onError: (error: unknown) => {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const message = detail || "Não foi possível registrar a observação.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!open) {
      setNoteText("");
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (trimmed.length < 5) {
      toast.error("A observação deve conter pelo menos 5 caracteres.");
      return;
    }
    if (!patientId) {
      return;
    }
    addNoteMutation.mutate(trimmed);
  };

  const renderRecordDetails = () => {
    if (isLoadingRecord || isFetchingRecord) {
      return (
        <div className="py-10">
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (recordError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar o prontuário do paciente.
          </AlertDescription>
        </Alert>
      );
    }

    if (!record) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este paciente ainda não possui prontuário preenchido.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-xl border bg-background/95 p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Informações clínicas
          </h3>
          <Separator className="my-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Queixa principal
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.queixas_principais}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Histórico médico
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.historico_medico || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Antecedentes familiares
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.antecedentes_familiares || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Alergias
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.alergias || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Medicamentos em uso
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.medicamentos_em_uso || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Observações gerais
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {record.observacoes_gerais || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-background/95 p-4 shadow-sm sm:p-5">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Contato de emergência
          </h3>
          <Separator className="my-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Nome
              </p>
              <p className="text-sm font-medium">
                {record.contato_emergencia_nome || "Não informado"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Telefone
              </p>
              <p className="text-sm font-medium">
                {record.contato_emergencia_telefone || "Não informado"}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderNotes = () => {
    if (isLoadingNotes) {
      return (
        <div className="py-6">
          <LoadingSpinner size="sm" />
        </div>
      );
    }

    if (notesError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não foi possível carregar as observações anteriores.
          </AlertDescription>
        </Alert>
      );
    }

    if (!notes || notes.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Nenhuma observação registrada até o momento.
        </p>
      );
    }

    return (
      <div className="max-h-64 space-y-3 overflow-y-auto pr-1 sm:max-h-72 sm:pr-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded-lg border bg-muted/40 p-3 shadow-sm transition-colors hover:bg-muted/60"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">
                {note.doctor_nome || "Profissional"}
              </p>
              <span className="text-xs text-muted-foreground">
                {format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {note.observacao}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[min(95vw,720px)] overflow-hidden p-0">
        <div className="flex max-h-[85vh] flex-col">
          <div className="border-b bg-card/90 px-4 py-4 backdrop-blur sm:px-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl font-semibold">
                Prontuário do paciente {patientName ? `- ${patientName}` : ""}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Visualize o histórico clínico e registre observações para compartilhar com a equipe.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="space-y-8">
              {renderRecordDetails()}

              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold">Histórico de observações</h3>
                  {appointmentId && (
                    <span className="text-xs text-muted-foreground">
                      Relacionado à consulta: {appointmentId.slice(0, 8)}…
                    </span>
                  )}
                </div>
                {renderNotes()}
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-xl border bg-background/95 p-4 shadow-sm sm:p-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-semibold">
                    Registrar nova observação
                  </Label>
                  <Textarea
                    id="note"
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Descreva os pontos discutidos em consulta, evolução do paciente ou recomendações futuras."
                    rows={4}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="submit"
                    disabled={addNoteMutation.isPending || noteText.trim().length < 5}
                    className="w-full sm:w-auto"
                  >
                    {addNoteMutation.isPending ? "Salvando..." : "Adicionar observação"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
