import { http } from "./http";
import { AgendaDisponivel } from "@/types/Clinica";

export async function listarAgendasMedico(
  crm: number,
  codEspecialidade: number,
  offset = 0,
  codPlanoSaude?: number | null,
) {
  const { data } = await http.get<AgendaDisponivel[]>(`/api/agendas/medico/${crm}`, {
    params: { codEspecialidade, offset, codPlanoSaude },
  });
  return data;
}

export async function listarAgendasEspecialidade(
  codEspecialidade: number,
  offset = 0,
  codPlanoSaude?: number | null,
) {
  const { data } = await http.get<AgendaDisponivel[]>(
    `/api/agendas/especialidade/${codEspecialidade}`,
    { params: { offset, codPlanoSaude } },
  );
  return data;
}
