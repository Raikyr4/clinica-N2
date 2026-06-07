import { http } from "./http";
import { EspecialidadeMedica, Modalidade } from "@/types/Clinica";

export async function listarEspecialidades(modalidade: Modalidade, codPlanoSaude?: number | null) {
  const { data } = await http.get<EspecialidadeMedica[]>("/api/especialidades", {
    params: { modalidade, codPlanoSaude },
  });
  return data;
}
