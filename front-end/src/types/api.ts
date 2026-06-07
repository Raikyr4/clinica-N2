export enum UserRole {
  MEDICO = 1,
  PACIENTE = 2,
}

export enum SlotStatus {
  LIVRE = 0,
  RESERVADO = 1,
  CONCLUIDO = 2,
  CANCELADO = 3,
}

export enum AppointmentStatus {
  AGENDADA = 0,
  REALIZADA = 1,
  CANCELADA = 2,
}

export type PaymentMethod = "CARTAO_FAKE" | "DINHEIRO" | "PIX";

export enum PaymentStatus {
  APROVADO = 0,
  NEGADO = 1,
  ESTORNADO = 2,
}

export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.MEDICO]: "Médico",
  [UserRole.PACIENTE]: "Paciente",
};

export const SlotStatusLabel: Record<SlotStatus, string> = {
  [SlotStatus.LIVRE]: "Livre",
  [SlotStatus.RESERVADO]: "Reservado",
  [SlotStatus.CONCLUIDO]: "Concluído",
  [SlotStatus.CANCELADO]: "Cancelado",
};

export const AppointmentStatusLabel: Record<AppointmentStatus, string> = {
  [AppointmentStatus.AGENDADA]: "Agendada",
  [AppointmentStatus.REALIZADA]: "Realizada",
  [AppointmentStatus.CANCELADA]: "Cancelada",
};

export const PaymentStatusLabel: Record<PaymentStatus, string> = {
  [PaymentStatus.APROVADO]: "Aprovado",
  [PaymentStatus.NEGADO]: "Negado",
  [PaymentStatus.ESTORNADO]: "Estornado",
};

export interface PatientProfile {
  id?: string;
  user_id?: string;
  data_nascimento: string;
  telefone: string;
  endereco: string;
  sexo: string;
  estado_civil?: string | null;
  profissao?: string | null;
  convenio?: string | null;
}

export interface PatientRecord {
  id?: string;
  patient_id?: string;
  queixas_principais: string;
  historico_medico?: string | null;
  antecedentes_familiares?: string | null;
  alergias?: string | null;
  medicamentos_em_uso?: string | null;
  observacoes_gerais?: string | null;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientRecordNote {
  id: string;
  record_id: string;
  doctor_id?: string | null;
  doctor_nome?: string | null;
  appointment_id?: string | null;
  observacao: string;
  created_at: string;
}

export interface UserResponse {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  patient_profile?: PatientProfile | null;
  medical_record?: PatientRecord | null;
}

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { access_token: string; refresh_token: string; token_type: string; }

export interface RegisterRequest {
  nome: string;
  email: string;
  cpf: string;
  password: string;
  role?: UserRole;
  patient_profile?: PatientProfile;
  patient_record?: PatientRecord;
  crm_crp?: string;
  especialidade?: string;
  bio?: string;
  valor_padrao_consulta?: number;
}

export interface DoctorProfile {
  id?: string;
  user_id: string;
  crm_crp?: string;
  especialidade?: string;
  bio?: string;
  valor_padrao_consulta?: number;
}

export interface DoctorProfileUpdateRequest {
  crm_crp?: string;
  especialidade?: string;
  bio?: string;
  valor_padrao_consulta?: number;
}

export interface DoctorResponse extends UserResponse {
  doctor_profile?: DoctorProfile;
}

export interface AgendaSlot {
  id: string;
  doctor_id: string;
  inicio: string;
  fim: string;
  status: SlotStatus;
  doctor_location_id?: string | null;
  valor_consulta?: number | null;
  created_by?: string;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  slot_id: string;
  patient_id: string;
  doctor_id: string;
  status: AppointmentStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  slot?: AgendaSlot;
  patient?: UserResponse;
  doctor?: DoctorResponse;
}

export interface Payment {
  id: string;
  appointment_id: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  nsu_fake?: string;
  data_pagamento?: string;
  created_at: string;
  updated_at: string;
  appointment?: Appointment;
}

export interface DashboardKPIs {
  total_consultas_mes: number;
  faturamento_mes: number;
  taxa_ocupacao: number;
  proximos_atendimentos: Appointment[];
  total_usuarios_ativos: number;
  mes_referencia: string;
}

export interface FinancialInsights {
  receita_recebida: number;
  receita_prevista: number;
  receita_bruta: number;
  receita_nao_aprovada: number;
  ticket_medio: number;
  consultas_com_pagamento: number;
  consultas_sem_pagamento: number;
}

export enum ReportQueueStatus {
  PENDENTE = 0,
  PROCESSANDO = 1,
  CONCLUIDO = 2,
  ERRO = 3,
  CANCELADO = 4,
}

export const ReportQueueStatusLabel: Record<ReportQueueStatus, string> = {
  [ReportQueueStatus.PENDENTE]: "Pendente",
  [ReportQueueStatus.PROCESSANDO]: "Processando",
  [ReportQueueStatus.CONCLUIDO]: "Concluído",
  [ReportQueueStatus.ERRO]: "Erro",
  [ReportQueueStatus.CANCELADO]: "Cancelado",
};

export interface ReportQueueItem {
  id: string;
  tenant_id?: string | null;
  tipo_relatorio: string;
  solicitado_por?: string | null;
  solicitado_em: string;
  prioridade: number;
  status: ReportQueueStatus;
  progress_percent?: number | null;
  tentativas: number;
  proximo_retry_em?: string | null;
  iniciado_em?: string | null;
  finalizado_em?: string | null;
  file_ref?: string | null;
  resultado_url?: string | null;
  resultado_path?: string | null;
  erro?: string | null;
}

export interface ReportQueueCreateRequest {
  tipo_relatorio: string;
  parametros?: Record<string, unknown>;
  prioridade?: number;
}


export enum MedicalCertificateRequestStatus {
  PENDENTE = 0,
  APROVADO = 1,
  REJEITADO = 2,
  GERADO = 3,
  ENVIADO = 4,
}

export const MedicalCertificateRequestStatusLabel: Record<MedicalCertificateRequestStatus, string> = {
  [MedicalCertificateRequestStatus.PENDENTE]: "Pendente",
  [MedicalCertificateRequestStatus.APROVADO]: "Aprovado",
  [MedicalCertificateRequestStatus.REJEITADO]: "Recusado",
  [MedicalCertificateRequestStatus.GERADO]: "Gerado",
  [MedicalCertificateRequestStatus.ENVIADO]: "Enviado",
};

export interface MedicalCertificateRequest {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  patient_nome?: string | null;
  doctor_nome?: string | null;
  motivo: string;
  status: MedicalCertificateRequestStatus;
  requested_at: string;
  reviewed_at?: string | null;
  review_notes?: string | null;
  report_queue_id?: string | null;
  delivered_at?: string | null;
}

export interface MonthlyRevenue { mes: string; total_consultas: number; valor_total: number; }

export interface PaginatedResponse<T> { items: T[]; total: number; skip: number; limit: number; }

export interface CreateUserRequest {
  nome: string; email: string; cpf?: string; password: string; role: UserRole;
  crm_crp?: string; especialidade?: string; bio?: string; valor_padrao_consulta?: number;
  patient_profile?: PatientProfile; patient_record?: PatientRecord;
}

export interface UpdateUserRequest {
  nome?: string; email?: string; cpf?: string; password?: string; ativo?: boolean;
}

export interface CreateSlotRequest { inicio: string; fim: string; doctor_location_id: string; valor_consulta?: number; }
export interface CreateAppointmentRequest { slot_id: string; patient_id?: string; }
export interface UpdateAppointmentStatusRequest { status: AppointmentStatus; }
export interface CreatePaymentRequest { appointment_id: string; valor?: number; metodo?: PaymentMethod; }

export interface ConsultasPorPeriodoResponse {
  periodo: string; total: number; agendadas: number; realizadas: number; canceladas: number;
}

export interface PagamentosPorPeriodoResponse { periodo: string; total: number; valor_total: number; }

export interface OcupacaoMedicoResponse {
  doctor_id: string; doctor_nome: string; total_slots: number;
  slots_livres: number; slots_reservados: number; slots_concluidos: number; taxa_ocupacao: number;
}

export interface ProximoAtendimento { id: string; data_hora: string; paciente?: string; medico?: string; }

export interface DoctorReportSummary {
  periodo: string; total_consultas: number; agendadas: number; realizadas: number; canceladas: number;
  pacientes_unicos: number; receita_recebida: number; receita_pendente: number;
  ticket_medio: number; consultas_sem_pagamento: number;
}

export interface DoctorReportCatalogItem {
  key: string;
  report_key: string;
  name: string;
  nome: string;
  description: string;
  descricao: string;
}

export interface GenerateDoctorReportRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  parametros?: Record<string, unknown>;
}

export interface DoctorLocation {
  id: string;
  doctor_id: string;
  nome: string;
  endereco: string;
  complemento?: string | null;
  cidade: string;
  estado: string;
  telefone?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorLocationRequest {
  nome: string;
  endereco: string;
  complemento?: string;
  cidade: string;
  estado: string;
  telefone?: string;
}

export interface UpdateDoctorLocationRequest {
  nome?: string;
  endereco?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo?: boolean;
}

export interface APIError { detail: string | ValidationError[]; }
export interface ValidationError { loc: (string | number)[]; msg: string; type: string; }


export enum DoctorAiAssistantStatus {
  INATIVO = 0,
  ATIVO = 1,
  PAUSADO = 2,
  CANCELADO = 3,
}

export interface DoctorAiUsage {
  reference_month: string;
  inbound_messages: number;
  outbound_messages: number;
  tokens_used: number;
  limits_messages: number;
  limits_tokens: number;
}

export interface OpenAiCostLineItem {
  line_item?: string | null;
  project_id?: string | null;
  amount_value: number;
  amount_currency?: string | null;
}

export interface OpenAiDashboard {
  available: boolean;
  provider: string;
  model?: string | null;
  usage_dashboard_url: string;
  costs_dashboard_url: string;
  period_start?: string | null;
  period_end?: string | null;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  total_tokens: number;
  request_count: number;
  total_cost_value?: number | null;
  total_cost_currency?: string | null;
  costs: OpenAiCostLineItem[];
  source: string;
  last_synced_at?: string | null;
  error?: string | null;
}

export interface DoctorAiAssistantSettings {
  doctor_id: string;
  status: DoctorAiAssistantStatus;
  provider_key: string;
  whatsapp_number?: string | null;
  timezone?: string | null;
  working_hours?: Record<string, unknown> | null;
  auto_messages?: Record<string, unknown> | null;
  allowed_flows?: unknown[] | null;
  permissions?: Record<string, unknown> | null;
  usage: DoctorAiUsage;
  openai_dashboard: OpenAiDashboard;
}

export interface DoctorAiInteraction {
  id: string;
  doctor_id: string;
  patient_phone: string;
  channel: string;
  direction: number;
  message_text: string;
  intent?: string | null;
  action_taken?: string | null;
  escalated_to_human: boolean;
  created_at: string;
}

export interface DoctorAiChatTurn {
  user_message: DoctorAiInteraction;
  assistant_message: DoctorAiInteraction;
}


export interface DoctorPlanOption {
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  includes_ai_chatbot: boolean;
  features: string[];
}

export interface DoctorPaymentMethod {
  id: string;
  holder_name: string;
  holder_document: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
}

export interface DoctorCurrentSubscription {
  plan?: DoctorPlanOption | null;
  status: number;
  renews_at?: string | null;
  includes_ai_chatbot: boolean;
}
