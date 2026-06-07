import { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { AgendaDisponivel, ComprovanteAgendamento, Modalidade, Paciente } from "@/types/Clinica";

export type EtapaAgendamento =
  | "MODALIDADE"
  | "ESPECIALIDADE"
  | "MEDICO"
  | "AGENDA"
  | "PACIENTE"
  | "CONFIRMACAO"
  | "COMPROVANTE";

export interface AgendamentoState {
  etapa: EtapaAgendamento;
  modalidade: Modalidade | null;
  codPlanoSaude: number | null;
  planoNome: string;
  codEspecialidade: number | null;
  especialidadeNome: string;
  crmMedico: number | null;
  medicoNome: string;
  semPreferenciaMedico: boolean;
  agendaSelecionada: AgendaDisponivel | null;
  pacienteSelecionado: Paciente | null;
  offsetAgenda: number;
  comprovante: ComprovanteAgendamento | null;
}

type AgendamentoAction =
  | { type: "SELECIONAR_MODALIDADE"; modalidade: Modalidade; codPlanoSaude?: number | null; planoNome?: string }
  | { type: "SELECIONAR_ESPECIALIDADE"; codigo: number; nome: string }
  | { type: "SELECIONAR_MEDICO"; crm: number | null; nome?: string; semPreferencia: boolean }
  | { type: "SELECIONAR_AGENDA"; agenda: AgendaDisponivel }
  | { type: "SELECIONAR_PACIENTE"; paciente: Paciente }
  | { type: "SET_OFFSET_AGENDA"; offset: number }
  | { type: "SET_COMPROVANTE"; comprovante: ComprovanteAgendamento }
  | { type: "VOLTAR" }
  | { type: "REINICIAR" };

const initialState: AgendamentoState = {
  etapa: "MODALIDADE",
  modalidade: null,
  codPlanoSaude: null,
  planoNome: "",
  codEspecialidade: null,
  especialidadeNome: "",
  crmMedico: null,
  medicoNome: "",
  semPreferenciaMedico: false,
  agendaSelecionada: null,
  pacienteSelecionado: null,
  offsetAgenda: 0,
  comprovante: null,
};

const previousStep: Record<EtapaAgendamento, EtapaAgendamento> = {
  MODALIDADE: "MODALIDADE",
  ESPECIALIDADE: "MODALIDADE",
  MEDICO: "ESPECIALIDADE",
  AGENDA: "MEDICO",
  PACIENTE: "AGENDA",
  CONFIRMACAO: "PACIENTE",
  COMPROVANTE: "CONFIRMACAO",
};

function reducer(state: AgendamentoState, action: AgendamentoAction): AgendamentoState {
  switch (action.type) {
    case "SELECIONAR_MODALIDADE":
      return {
        ...initialState,
        modalidade: action.modalidade,
        codPlanoSaude: action.codPlanoSaude ?? null,
        planoNome: action.planoNome ?? "",
        etapa: "ESPECIALIDADE",
      };
    case "SELECIONAR_ESPECIALIDADE":
      return {
        ...state,
        codEspecialidade: action.codigo,
        especialidadeNome: action.nome,
        crmMedico: null,
        medicoNome: "",
        semPreferenciaMedico: false,
        agendaSelecionada: null,
        offsetAgenda: 0,
        etapa: "MEDICO",
      };
    case "SELECIONAR_MEDICO":
      return {
        ...state,
        crmMedico: action.crm,
        medicoNome: action.nome ?? "",
        semPreferenciaMedico: action.semPreferencia,
        agendaSelecionada: null,
        offsetAgenda: 0,
        etapa: "AGENDA",
      };
    case "SELECIONAR_AGENDA":
      return { ...state, agendaSelecionada: action.agenda, etapa: "PACIENTE" };
    case "SELECIONAR_PACIENTE":
      return { ...state, pacienteSelecionado: action.paciente, etapa: "CONFIRMACAO" };
    case "SET_OFFSET_AGENDA":
      return { ...state, offsetAgenda: action.offset };
    case "SET_COMPROVANTE":
      return { ...state, comprovante: action.comprovante, etapa: "COMPROVANTE" };
    case "VOLTAR":
      return { ...state, etapa: previousStep[state.etapa] };
    case "REINICIAR":
      return initialState;
    default:
      return state;
  }
}

interface AgendamentoContextValue {
  state: AgendamentoState;
  dispatch: React.Dispatch<AgendamentoAction>;
}

const AgendamentoContext = createContext<AgendamentoContextValue | null>(null);

export function AgendamentoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AgendamentoContext.Provider value={value}>{children}</AgendamentoContext.Provider>;
}

export function useAgendamento() {
  const context = useContext(AgendamentoContext);

  if (!context) {
    throw new Error("useAgendamento deve ser usado dentro de AgendamentoProvider");
  }

  return context;
}
