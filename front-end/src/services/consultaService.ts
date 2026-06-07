import { http } from "./http";
import { ComprovanteAgendamento, ConfirmarConsultaRequest } from "@/types/Clinica";

export async function registrarOpcao(
  crmMedico: number,
  codEspecialidade: number,
  data: string,
  horario: string,
) {
  await http.post("/api/consultas/registrar-opcao", {
    crmMedico,
    codEspecialidade,
    data,
    horario,
  });
}

export async function confirmarConsulta(request: ConfirmarConsultaRequest) {
  const { data } = await http.post<ComprovanteAgendamento>("/api/consultas/confirmar", request);
  return data;
}
