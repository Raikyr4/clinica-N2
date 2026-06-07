import { http } from "./http";
import { ComprovanteAgendamento, ConfirmarConsultaRequest, RegistrarOpcaoResponse } from "@/types/Clinica";

export async function registrarOpcao(
  crmMedico: number,
  codEspecialidade: number,
  data: string,
  horario: string,
) {
  const { data: response } = await http.post<RegistrarOpcaoResponse>("/api/consultas/registrar-opcao", {
    crmMedico,
    codEspecialidade,
    data,
    horario,
  });
  return response;
}

export async function confirmarConsulta(request: ConfirmarConsultaRequest) {
  const { data } = await http.post<ComprovanteAgendamento>("/api/consultas/confirmar", request);
  return data;
}
