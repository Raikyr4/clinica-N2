export const SecretaryPermission = {
  AGENDA_READ: "AGENDA_READ",
  AGENDA_WRITE: "AGENDA_WRITE",
  APPOINTMENTS_READ: "APPOINTMENTS_READ",
  APPOINTMENTS_CANCEL: "APPOINTMENTS_CANCEL",
  APPOINTMENTS_RESCHEDULE: "APPOINTMENTS_RESCHEDULE",
  REPORTS_VIEW: "REPORTS_VIEW",
  REPORTS_CREATE: "REPORTS_CREATE",
  TASKS_VIEW: "TASKS_VIEW",
  TASKS_MANAGE: "TASKS_MANAGE",
  EXAMS_VIEW: "EXAMS_VIEW",
  PATIENT_CONTACT_VIEW: "PATIENT_CONTACT_VIEW",
  PATIENT_CONTACT_EDIT: "PATIENT_CONTACT_EDIT",
  BILLING_VIEW: "BILLING_VIEW",
  SETTINGS_VIEW: "SETTINGS_VIEW",
  SETTINGS_EDIT: "SETTINGS_EDIT",
  PRICE_EDIT: "PRICE_EDIT",
} as const;

export type SecretaryPermissionKey =
  (typeof SecretaryPermission)[keyof typeof SecretaryPermission];

export const SECRETARY_PERMISSION_CATALOG: Array<{ key: SecretaryPermissionKey; label: string }> = [
  { key: SecretaryPermission.AGENDA_READ, label: "Visualizar agenda" },
  { key: SecretaryPermission.AGENDA_WRITE, label: "Editar agenda" },
  { key: SecretaryPermission.APPOINTMENTS_READ, label: "Visualizar consultas" },
  { key: SecretaryPermission.APPOINTMENTS_CANCEL, label: "Cancelar consultas" },
  { key: SecretaryPermission.APPOINTMENTS_RESCHEDULE, label: "Remarcar consultas" },
  { key: SecretaryPermission.REPORTS_VIEW, label: "Visualizar relatórios" },
  { key: SecretaryPermission.REPORTS_CREATE, label: "Gerar relatórios" },
  { key: SecretaryPermission.TASKS_VIEW, label: "Visualizar tarefas" },
  { key: SecretaryPermission.TASKS_MANAGE, label: "Gerenciar tarefas" },
  { key: SecretaryPermission.EXAMS_VIEW, label: "Visualizar exames anexados" },
  { key: SecretaryPermission.PATIENT_CONTACT_VIEW, label: "Visualizar contato de paciente" },
  { key: SecretaryPermission.PATIENT_CONTACT_EDIT, label: "Editar contato de paciente" },
  { key: SecretaryPermission.BILLING_VIEW, label: "Visualizar financeiro" },
  { key: SecretaryPermission.SETTINGS_VIEW, label: "Visualizar configurações" },
  { key: SecretaryPermission.SETTINGS_EDIT, label: "Editar configurações" },
  { key: SecretaryPermission.PRICE_EDIT, label: "Editar preço da consulta" },
];
