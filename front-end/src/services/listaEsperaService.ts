import { http } from "./http";

export async function incluirListaEspera(codPaciente: number, crmMedico: number, codEspecialidade: number) {
  const { data } = await http.post<{ posicaoFila: number }>("/api/lista-espera", {
    codPaciente,
    crmMedico,
    codEspecialidade,
  });
  return data;
}
