import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useNotificationPreferencesStore,
  type NotificationScheduleType,
  type UserNotificationPreferences,
} from "@/store/notifications";
import { UserRole } from "@/types/api";
import { toast } from "sonner";
import { X } from "lucide-react";

interface NotificationOption {
  key: string;
  label: string;
  description: string;
}

const channelOptions: NotificationOption[] = [
  {
    key: "email",
    label: "Email",
    description: "Receba atualizações no seu endereço de email.",
  },
  {
    key: "sms",
    label: "SMS",
    description: "Alertas rápidos enviados para o seu celular.",
  },
  {
    key: "push",
    label: "Push",
    description: "Notificações instantâneas no navegador.",
  },
];

const alertsByRole: Partial<Record<UserRole, NotificationOption[]>> = {
  [UserRole.MEDICO]: [
    {
      key: "new-appointments",
      label: "Novos agendamentos",
      description: "Receba alertas quando novas consultas forem agendadas.",
    },
    {
      key: "appointment-reminders",
      label: "Lembretes de consulta",
      description: "Notificações automáticas antes dos atendimentos.",
    },
    {
      key: "patient-messages",
      label: "Mensagens de pacientes",
      description: "Avisos sobre novas mensagens ou solicitações.",
    },
    {
      key: "report-status",
      label: "Status de relatórios",
      description: "Atualizações sobre relatórios solicitados.",
    },
  ],
  [UserRole.PACIENTE]: [
    {
      key: "appointment-confirmation",
      label: "Confirmação de consulta",
      description: "Confirmações de agendamento e alterações de horário.",
    },
    {
      key: "appointment-reminder",
      label: "Lembretes de consulta",
      description: "Avisos antes do horário marcado.",
    },
    {
      key: "payment-updates",
      label: "Atualizações de pagamento",
      description: "Avisos sobre aprovação ou pendência de pagamentos.",
    },
    {
      key: "medical-updates",
      label: "Atualizações do prontuário",
      description: "Alertas quando novos registros estiverem disponíveis.",
    },
  ],
};

const scheduleTypes: Array<{ value: NotificationScheduleType; label: string }> = [
  { value: "daily", label: "Todos os dias" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const weekDays = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const buildDefaultPreferences = (role: UserRole): UserNotificationPreferences => ({
  channels: {
    email: true,
    sms: false,
    push: true,
  },
  alerts: (alertsByRole[role] ?? []).reduce<Record<string, boolean>>((acc, option) => {
    acc[option.key] = true;
    return acc;
  }, {}),
  preferredTime: "08:00",
  contacts: {
    emails: [],
    phones: [],
  },
  schedule: {
    type: "daily",
    daysOfWeek: [1, 2, 3, 4, 5],
    dayOfMonth: 7,
  },
});

interface NotificationPreferencesCardProps {
  userId: string;
  role: UserRole;
  title?: string;
  description?: string;
}

export function NotificationPreferencesCard({
  userId,
  role,
  title = "",
  description = "Escolha como deseja receber alertas importantes.",
}: NotificationPreferencesCardProps) {
  const {
    preferences,
    ensurePreferences,
    updateChannel,
    updateAlert,
    updatePreferredTime,
    setContactEmails,
    setContactPhones,
    setScheduleType,
    toggleScheduleDay,
    setDayOfMonth,
    resetPreferences,
  } = useNotificationPreferencesStore();

  const defaultPreferences = useMemo(() => buildDefaultPreferences(role), [role]);
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    ensurePreferences(userId, defaultPreferences);
  }, [defaultPreferences, ensurePreferences, userId]);

  const currentPreferences = useMemo(
    () => ({
      ...defaultPreferences,
      ...(preferences[userId] ?? {}),
      channels: {
        ...defaultPreferences.channels,
        ...(preferences[userId]?.channels ?? {}),
      },
      alerts: {
        ...defaultPreferences.alerts,
        ...(preferences[userId]?.alerts ?? {}),
      },
      contacts: {
        ...defaultPreferences.contacts,
        ...(preferences[userId]?.contacts ?? {}),
      },
      schedule: {
        ...defaultPreferences.schedule,
        ...(preferences[userId]?.schedule ?? {}),
      },
    }),
    [defaultPreferences, preferences, userId]
  );
  const schedule = currentPreferences.schedule ?? defaultPreferences.schedule;

  const alertOptions = alertsByRole[role];

  const handleReset = () => {
    resetPreferences(userId, defaultPreferences);
    toast.success("Preferências restauradas para os padrões.");
  };

  const handleAddEmail = () => {
    const normalized = emailInput.trim().toLowerCase();
    if (!normalized) {
      toast.error("Informe um email válido.");
      return;
    }
    if (currentPreferences.contacts.emails.includes(normalized)) {
      toast.error("Esse email já está na lista.");
      return;
    }
    setContactEmails(userId, [...currentPreferences.contacts.emails, normalized]);
    setEmailInput("");
    toast.success("Email adicionado.");
  };

  const handleRemoveEmail = (email: string) => {
    setContactEmails(
      userId,
      currentPreferences.contacts.emails.filter((item) => item !== email)
    );
  };

  const handleAddPhone = () => {
    const normalized = phoneInput.trim();
    if (!normalized) {
      toast.error("Informe um telefone válido.");
      return;
    }
    if (currentPreferences.contacts.phones.includes(normalized)) {
      toast.error("Esse telefone já está na lista.");
      return;
    }
    setContactPhones(userId, [...currentPreferences.contacts.phones, normalized]);
    setPhoneInput("");
    toast.success("Telefone adicionado.");
  };

  const handleRemovePhone = (phone: string) => {
    setContactPhones(
      userId,
      currentPreferences.contacts.phones.filter((item) => item !== phone)
    );
  };

  const handleDayOfMonthChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.min(31, Math.max(1, parsed));
    setDayOfMonth(userId, clamped);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Restaurar padrão
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Horário preferido</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="time"
              value={currentPreferences.preferredTime}
              onChange={(event) => updatePreferredTime(userId, event.target.value)}
              className="w-[160px]"
            />
            <p className="text-sm text-muted-foreground">
              Usaremos este horário para priorizar o envio de alertas.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Frequência dos alertas</p>
          <div className="grid gap-3 md:grid-cols-3">
            {scheduleTypes.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={schedule.type === option.value ? "default" : "outline"}
                onClick={() => setScheduleType(userId, option.value)}
                className="justify-start"
              >
                {option.label}
              </Button>
            ))}
          </div>

          {schedule.type === "weekly" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Escolha os dias da semana</p>
              <div className="flex flex-wrap gap-4">
                {weekDays.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={schedule.daysOfWeek.includes(day.value)}
                      onCheckedChange={() => toggleScheduleDay(userId, day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {schedule.type === "monthly" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="number"
                min={1}
                max={31}
                value={schedule.dayOfMonth}
                onChange={(event) => handleDayOfMonthChange(event.target.value)}
                className="w-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                Enviar todo dia {schedule.dayOfMonth} do mês.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Destinatários de alerta</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Emails</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="email@exemplo.com"
                />
                <Button type="button" variant="outline" onClick={handleAddEmail}>
                  Adicionar
                </Button>
              </div>
              {currentPreferences.contacts.emails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentPreferences.contacts.emails.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemoveEmail(email)}
                        aria-label={`Remover ${email}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum email cadastrado.</p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Telefones</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <Button type="button" variant="outline" onClick={handleAddPhone}>
                  Adicionar
                </Button>
              </div>
              {currentPreferences.contacts.phones.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentPreferences.contacts.phones.map((phone) => (
                    <Badge key={phone} variant="secondary" className="flex items-center gap-1">
                      {phone}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemovePhone(phone)}
                        aria-label={`Remover ${phone}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Canais preferidos</p>
          <div className="grid gap-4 md:grid-cols-3">
            {channelOptions.map((option) => (
              <div
                key={option.key}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <Switch
                  checked={currentPreferences.channels[option.key as keyof typeof currentPreferences.channels]}
                  onCheckedChange={(checked) =>
                    updateChannel(userId, option.key as "email" | "sms" | "push", checked)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Alertas por evento</p>
          <div className="grid gap-4 md:grid-cols-2">
            {alertOptions.map((option) => (
              <div key={option.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <Switch
                  checked={currentPreferences.alerts[option.key] ?? false}
                  onCheckedChange={(checked) => updateAlert(userId, option.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
