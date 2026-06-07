import { http } from "./http";
import { CadastrarPacienteRequest, Paciente } from "@/types/Clinica";

export async function buscarPacientes(nome: string, nomeMae: string) {
  const { data } = await http.get<Paciente[]>("/api/pacientes", {
    params: { nome, nomeMae },
  });
  return data;
}

export async function cadastrarPaciente(request: CadastrarPacienteRequest) {
  const { data } = await http.post<Paciente>("/api/pacientes", request);
  return data;
}
