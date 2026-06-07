export type Modalidade = "P" | "C";

export interface EspecialidadeMedica {
  codigo: number;
  nome: string;
}

export interface Medico {
  crm: number;
  nome: string;
  email?: string;
  telefone?: string;
}

export interface PlanoSaude {
  codigo: number;
  nome: string;
}

export interface AgendaDisponivel {
  crmMedico: number;
  nomeMedico: string;
  codEspecialidade: number;
  nomeEspecialidade: string;
  data: string;
  horario: string;
}

export interface Paciente {
  codigo: number;
  nome: string;
  nomeMae: string;
  dataNasc: string;
  sexo: "F" | "M";
  endereco: string;
  telefone: string;
  email?: string;
  cpf?: string;
  nomeResponsavel?: string;
  grauParentesco?: string;
  telefoneResponsavel?: string;
  planoSaude?: string;
}

export interface RegistrarOpcaoResponse {
  opcaoAgendamentoId: string;
  mensagem: string;
}

export interface CadastrarPacienteRequest {
  nome: string;
  nomeMae: string;
  dataNasc: string;
  sexo: "F" | "M";
  endereco: string;
  telefone: string;
  email?: string;
  cpf?: string;
  nomeResponsavel?: string;
  grauParentesco?: string;
  telefoneResponsavel?: string;
  codPlanoSaude?: number | null;
  numeroCarteirinha?: string;
}

export interface ConfirmarConsultaRequest {
  crmMedico: number;
  codEspecialidade: number;
  data: string;
  horario: string;
  codPaciente: number;
  tipo: Modalidade;
  codPlanoSaude?: number | null;
  opcaoAgendamentoId?: string | null;
}

export interface ComprovanteAgendamento {
  codigo: number;
  data: string;
  horario: string;
  crmMedico: number;
  nomeMedico: string;
  nomeEspecialidade: string;
  codPaciente: number;
  nomePaciente: string;
  situacao: string;
  modalidade: string;
  planoSaude?: string;
}
