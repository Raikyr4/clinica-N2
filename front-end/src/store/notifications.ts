import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type NotificationChannel = "email" | "sms" | "push";
export type NotificationScheduleType = "daily" | "weekly" | "monthly";

export interface NotificationChannelPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationAlertPreferences {
  [key: string]: boolean;
}

export interface NotificationContactPreferences {
  emails: string[];
  phones: string[];
}

export interface UserNotificationPreferences {
  channels: NotificationChannelPreferences;
  alerts: NotificationAlertPreferences;
  preferredTime: string;
  contacts: NotificationContactPreferences;
  schedule: NotificationSchedulePreferences;
}

export interface NotificationSchedulePreferences {
  type: NotificationScheduleType;
  daysOfWeek: number[];
  dayOfMonth: number;
}

const mergePreferences = (
  current: UserNotificationPreferences | undefined,
  defaults: UserNotificationPreferences
): UserNotificationPreferences => ({
  ...defaults,
  ...current,
  channels: {
    ...defaults.channels,
    ...(current?.channels ?? {}),
  },
  alerts: {
    ...defaults.alerts,
    ...(current?.alerts ?? {}),
  },
  contacts: {
    ...defaults.contacts,
    ...(current?.contacts ?? {}),
  },
  schedule: {
    ...defaults.schedule,
    ...(current?.schedule ?? {}),
  },
});

interface NotificationPreferencesState {
  preferences: Record<string, UserNotificationPreferences>;
  ensurePreferences: (userId: string, defaults: UserNotificationPreferences) => void;
  updateChannel: (userId: string, channel: NotificationChannel, enabled: boolean) => void;
  updateAlert: (userId: string, alertKey: string, enabled: boolean) => void;
  updatePreferredTime: (userId: string, time: string) => void;
  setContactEmails: (userId: string, emails: string[]) => void;
  setContactPhones: (userId: string, phones: string[]) => void;
  setScheduleType: (userId: string, type: NotificationScheduleType) => void;
  toggleScheduleDay: (userId: string, day: number) => void;
  setDayOfMonth: (userId: string, day: number) => void;
  resetPreferences: (userId: string, defaults: UserNotificationPreferences) => void;
}

const STORAGE_KEY = "notification-preferences";

const storage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(name);
  },
};

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: {},
      ensurePreferences: (userId, defaults) =>
        set((state) => {
          return {
            preferences: {
              ...state.preferences,
              [userId]: mergePreferences(state.preferences[userId], defaults),
            },
          };
        }),
      updateChannel: (userId, channel, enabled) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                channels: {
                  ...current.channels,
                  [channel]: enabled,
                },
              },
            },
          };
        }),
      updateAlert: (userId, alertKey, enabled) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                alerts: {
                  ...current.alerts,
                  [alertKey]: enabled,
                },
              },
            },
          };
        }),
      updatePreferredTime: (userId, time) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                preferredTime: time,
              },
            },
          };
        }),
      setContactEmails: (userId, emails) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                contacts: {
                  ...current.contacts,
                  emails,
                },
              },
            },
          };
        }),
      setContactPhones: (userId, phones) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                contacts: {
                  ...current.contacts,
                  phones,
                },
              },
            },
          };
        }),
      setScheduleType: (userId, type) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                schedule: {
                  ...current.schedule,
                  type,
                },
              },
            },
          };
        }),
      toggleScheduleDay: (userId, day) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          const exists = current.schedule.daysOfWeek.includes(day);
          const nextDays = exists
            ? current.schedule.daysOfWeek.filter((value) => value !== day)
            : [...current.schedule.daysOfWeek, day].sort((a, b) => a - b);
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                schedule: {
                  ...current.schedule,
                  daysOfWeek: nextDays,
                },
              },
            },
          };
        }),
      setDayOfMonth: (userId, day) =>
        set((state) => {
          const current = state.preferences[userId];
          if (!current) {
            return state;
          }
          return {
            preferences: {
              ...state.preferences,
              [userId]: {
                ...current,
                schedule: {
                  ...current.schedule,
                  dayOfMonth: day,
                },
              },
            },
          };
        }),
      resetPreferences: (userId, defaults) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [userId]: mergePreferences(undefined, defaults),
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storage),
    }
  )
);
