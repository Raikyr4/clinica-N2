import apiClient from "./axios";
import { UserRole } from "@/types/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
  DoctorResponse,
  DoctorProfile,
  DoctorProfileUpdateRequest,
  AgendaSlot,
  Appointment,
  Payment,
  DashboardKPIs,
  MonthlyRevenue,
  CreateSlotRequest,
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  CreatePaymentRequest,
  ConsultasPorPeriodoResponse,
  PagamentosPorPeriodoResponse,
  OcupacaoMedicoResponse,
  PatientRecord,
  PatientRecordNote,
  DoctorReportSummary,
  FinancialInsights,
  ReportQueueItem,
  ReportQueueStatus,
  ReportQueueCreateRequest,
  DoctorReportCatalogItem,
  GenerateDoctorReportRequest,
  CreateUserRequest,
  UpdateUserRequest,
  DoctorLocation,
  CreateDoctorLocationRequest,
  UpdateDoctorLocationRequest,
  MedicalCertificateRequest,
  DoctorAiAssistantSettings,
  DoctorAiInteraction,
  DoctorAiChatTurn,
  DoctorPlanOption,
  DoctorCurrentSubscription,
  DoctorPaymentMethod,
} from "@/types/api";

// Auth endpoints
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/api/v1/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<UserResponse>("/api/v1/auth/register", {
      ...data,
      role: UserRole.PACIENTE,
    }),

  registerDoctor: (data: RegisterRequest) =>
    apiClient.post<UserResponse>("/api/v1/auth/register/doctor", {
      ...data,
      role: UserRole.MEDICO,
    }),

  registerDoctorWithPlan: (data: Record<string, unknown>) =>
    apiClient.post<UserResponse>("/api/v1/auth/register/doctor/with-plan", data),

  refresh: (refreshToken: string) =>
    apiClient.post<LoginResponse>("/api/v1/auth/refresh", { refresh_token: refreshToken }),

  me: () =>
    apiClient.get<UserResponse>("/api/v1/auth/me"),
};

// Doctors endpoints
export const doctorsApi = {
  list: () =>
    apiClient.get<DoctorResponse[]>("/api/v1/doctors"),

  get: (id: string) =>
    apiClient.get<DoctorResponse>(`/api/v1/doctors/${id}`),
};

export const profilesApi = {
  getDoctorMe: () =>
    apiClient.get<DoctorProfile>("/api/v1/profiles/doctor/me"),

  updateDoctorMe: (data: DoctorProfileUpdateRequest) =>
    apiClient.put<DoctorProfile>("/api/v1/profiles/doctor/me", data),
};

// Agenda/Slots endpoints
export const agendaApi = {
  getAgenda: (doctorId: string, start?: string, end?: string) =>
    apiClient.get<AgendaSlot[]>(`/api/v1/doctors/${doctorId}/agenda`, {
      params: { start, end },
    }),

  createSlot: (doctorId: string, data: CreateSlotRequest) =>
    apiClient.post<AgendaSlot>(`/api/v1/doctors/${doctorId}/agenda/slots`, data),

  deleteSlot: (slotId: string) =>
    apiClient.delete(`/api/v1/agenda/slots/${slotId}`),
};

// Appointments endpoints
export const appointmentsApi = {
  list: (skip = 0, limit = 50, referenceMonth?: string) => {
    const params: Record<string, unknown> = { skip, limit };
    if (referenceMonth) {
      params.reference_month = referenceMonth;
    }

    return apiClient.get<Appointment[]>("/api/v1/appointments", {
      params,
    });
  },

  create: (data: CreateAppointmentRequest) =>
    apiClient.post<Appointment>("/api/v1/appointments", data),

  updateStatus: (id: string, data: UpdateAppointmentStatusRequest) =>
    apiClient.patch<Appointment>(`/api/v1/appointments/${id}/status`, data),

  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/api/v1/appointments/${id}/cancel`, {}),
};

// Payments endpoints
export const paymentsApi = {
  list: (skip = 0, limit = 50) =>
    apiClient.get<Payment[]>("/api/v1/payments", {
      params: { skip, limit },
    }),

  get: (id: string) =>
    apiClient.get<Payment>(`/api/v1/payments/${id}`),

  create: (data: CreatePaymentRequest) =>
    apiClient.post<Payment>("/api/v1/payments", data),
};

// Dashboard/Reports endpoints
export const dashboardApi = {
  getKPIs: (referenceMonth?: string) => {
    const params = referenceMonth
      ? { reference_month: referenceMonth }
      : undefined;

    return apiClient.get<DashboardKPIs>("/api/v1/dashboard/kpis", { params });
  },
  getFinancialInsights: (referenceMonth?: string) => {
    const params = referenceMonth
      ? { reference_month: referenceMonth }
      : undefined;

    return apiClient.get<FinancialInsights>("/api/v1/dashboard/financial-insights", { params });
  },
};

export const reportsApi = {
  patientAppointments: () =>
    apiClient.get<ConsultasPorPeriodoResponse>("/api/v1/reports/patient/appointments"),

  patientPayments: () =>
    apiClient.get<PagamentosPorPeriodoResponse>("/api/v1/reports/patient/payments"),

  doctorOccupancy: () =>
    apiClient.get<OcupacaoMedicoResponse>("/api/v1/reports/doctor/occupancy"),

  enqueue: (data: ReportQueueCreateRequest) =>
    apiClient.post("/api/v1/reports/queue", data),

  queue: (status?: ReportQueueStatus) =>
    apiClient.get<ReportQueueItem[]>("/api/v1/reports/queue", {
      params: status ? { status } : undefined,
    }),

  queueItem: (id: string) =>
    apiClient.get<ReportQueueItem>(`/api/v1/reports/queue/${id}`),

  listReports: (status?: ReportQueueStatus) =>
    apiClient.get<ReportQueueItem[]>("/api/v1/reports", {
      params: status ? { status } : undefined,
    }),

  getReport: (id: string) =>
    apiClient.get<ReportQueueItem>(`/api/v1/reports/${id}`),

  cancelReport: (id: string) =>
    apiClient.post(`/api/v1/reports/${id}/cancel`),

  reissueReport: (id: string) =>
    apiClient.post(`/api/v1/reports/${id}/reissue`),

  deleteReport: (id: string) =>
    apiClient.delete(`/api/v1/reports/${id}`),

  downloadReport: (id: string) =>
    apiClient.get<Blob>(`/api/v1/reports/${id}/download`, {
      responseType: "blob",
    }),
};

export const doctorApi = {
  getDashboard: (referenceMonth?: string) => {
    const params = referenceMonth ? { reference_month: referenceMonth } : undefined;
    return apiClient.get<DashboardKPIs>("/api/v1/doctor/dashboard", { params });
  },

  getFinancial: (referenceMonth?: string) => {
    const params = referenceMonth ? { reference_month: referenceMonth } : undefined;
    return apiClient.get<FinancialInsights>("/api/v1/doctor/financial", { params });
  },

  getReportsCatalog: () =>
    apiClient.get<DoctorReportCatalogItem[]>("/api/v1/doctor/reports"),

  generateReport: (reportKey: string, data: GenerateDoctorReportRequest) =>
    apiClient.post(`/api/v1/doctor/reports/${reportKey}/generate`, data),

  getReportJob: (jobId: string) =>
    apiClient.get<ReportQueueItem>(`/api/v1/doctor/reports/jobs/${jobId}`),

  downloadReportJob: (jobId: string) =>
    apiClient.get<Blob>(`/api/v1/doctor/reports/jobs/${jobId}/download`, { responseType: "blob" }),
};

export const doctorLocationsApi = {
  list: () =>
    apiClient.get<DoctorLocation[]>("/api/v1/doctor/locations"),

  create: (data: CreateDoctorLocationRequest) =>
    apiClient.post<DoctorLocation>("/api/v1/doctor/locations", data),

  update: (id: string, data: UpdateDoctorLocationRequest) =>
    apiClient.put<DoctorLocation>(`/api/v1/doctor/locations/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/api/v1/doctor/locations/${id}`),
};

export const medicalRecordsApi = {
  getMine: () =>
    apiClient.get<PatientRecord>("/api/v1/medical-records/me"),

  updateMine: (data: Partial<PatientRecord>) =>
    apiClient.patch<PatientRecord>("/api/v1/medical-records/me", data),

  getMyNotes: () =>
    apiClient.get<PatientRecordNote[]>("/api/v1/medical-records/me/notes"),

  getPatientRecord: (patientId: string) =>
    apiClient.get<PatientRecord>(`/api/v1/medical-records/${patientId}`),

  getPatientNotes: (patientId: string) =>
    apiClient.get<PatientRecordNote[]>(`/api/v1/medical-records/${patientId}/notes`),

  addNote: (
    patientId: string,
    data: { observacao: string; appointment_id?: string }
  ) =>
    apiClient.post<PatientRecordNote>(
      `/api/v1/medical-records/${patientId}/notes`,
      data
    ),
};

export const usersApi = {
  list: (skip = 0, limit = 50) =>
    apiClient.get<UserResponse[]>("/api/v1/users", { params: { skip, limit } }),

  get: (id: string) =>
    apiClient.get<UserResponse>(`/api/v1/users/${id}`),

  create: (data: CreateUserRequest) =>
    apiClient.post<UserResponse>("/api/v1/users", data),

  update: (id: string, data: UpdateUserRequest) =>
    apiClient.put<UserResponse>(`/api/v1/users/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/api/v1/users/${id}`),
};


export const medicalCertificatesApi = {
  request: (data: { appointment_id: string; motivo: string }) =>
    apiClient.post<MedicalCertificateRequest>("/api/v1/medical-certificates/requests", data),

  listPatient: () =>
    apiClient.get<MedicalCertificateRequest[]>("/api/v1/medical-certificates/requests/patient"),

  listDoctor: () =>
    apiClient.get<MedicalCertificateRequest[]>("/api/v1/medical-certificates/requests/doctor"),

  listDoctorPending: () =>
    apiClient.get<MedicalCertificateRequest[]>("/api/v1/medical-certificates/requests/doctor/pending"),

  review: (requestId: string, data: { aprovar: boolean; observacoes?: string }) =>
    apiClient.patch<MedicalCertificateRequest>(`/api/v1/medical-certificates/requests/${requestId}/review`, data),

  download: (requestId: string) =>
    apiClient.get<Blob>(`/api/v1/medical-certificates/requests/${requestId}/download`, {
      responseType: "blob",
    }),
};


export const doctorAiAssistantApi = {
  get: () =>
    apiClient.get<DoctorAiAssistantSettings>("/api/v1/doctor/ai-assistant"),

  updateSettings: (data: Record<string, unknown>) =>
    apiClient.put<DoctorAiAssistantSettings>("/api/v1/doctor/ai-assistant/settings", data),

  updateStatus: (action: "activate" | "pause" | "cancel") =>
    apiClient.post<DoctorAiAssistantSettings>(`/api/v1/doctor/ai-assistant/${action}`),

  interactions: (limit = 30) =>
    apiClient.get<DoctorAiInteraction[]>("/api/v1/doctor/ai-assistant/interactions", { params: { limit } }),

  simulate: (data: { patient_phone: string; message: string }) =>
    apiClient.post<DoctorAiInteraction>("/api/v1/doctor/ai-assistant/simulate", data),

  chatMessages: (limit = 80) =>
    apiClient.get<DoctorAiInteraction[]>("/api/v1/doctor/ai-assistant/chat/messages", { params: { limit } }),

  sendChatMessage: (data: { message: string }) =>
    apiClient.post<DoctorAiChatTurn>("/api/v1/doctor/ai-assistant/chat/messages", data),
};


export const doctorBillingApi = {
  plans: () => apiClient.get<DoctorPlanOption[]>("/api/v1/doctor/billing/plans"),
  subscription: () => apiClient.get<DoctorCurrentSubscription>("/api/v1/doctor/billing/subscription"),
  changePlan: (plan_code: string) => apiClient.put<DoctorCurrentSubscription>("/api/v1/doctor/billing/subscription", { plan_code }),
  paymentMethods: () => apiClient.get<DoctorPaymentMethod[]>("/api/v1/doctor/billing/payment-methods"),
  addPaymentMethod: (data: Record<string, unknown>) => apiClient.post<DoctorPaymentMethod>("/api/v1/doctor/billing/payment-methods", data),
  deletePaymentMethod: (id: string) => apiClient.delete(`/api/v1/doctor/billing/payment-methods/${id}`),
  setDefaultPaymentMethod: (id: string) => apiClient.post(`/api/v1/doctor/billing/payment-methods/${id}/default`),
};
