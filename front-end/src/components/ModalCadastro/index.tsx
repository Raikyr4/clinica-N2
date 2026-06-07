import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CadastrarPacienteForm } from "@/pages/CadastrarPaciente";
import { Paciente } from "@/types/Clinica";

export function ModalCadastro({
  open,
  onOpenChange,
  onPacienteCriado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPacienteCriado: (paciente: Paciente) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo paciente</DialogTitle>
        </DialogHeader>
        <CadastrarPacienteForm
          onPacienteCriado={(paciente) => {
            onPacienteCriado(paciente);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
