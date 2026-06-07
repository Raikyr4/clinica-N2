import { http } from "./http";
import { Medico, Modalidade } from "@/types/Clinica";

export async function listarMedicos(
  modalidade: Modalidade,
  codEspecialidade: number,
  codPlanoSaude?: number | null,
) {
  const { data } = await http.get<Medico[]>("/api/medicos", {
    params: { modalidade, codEspecialidade, codPlanoSaude },
  });
  return data;
}
