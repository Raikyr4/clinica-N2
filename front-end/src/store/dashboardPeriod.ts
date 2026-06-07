import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dayjs } from "@/lib/date";

interface DashboardPeriodState {
  referenceMonth: string;
  setReferenceMonth: (value: string) => void;
  resetReferenceMonth: () => void;
}

const STORAGE_KEY = "dashboard-period";

const getDefaultReferenceMonth = () => dayjs().format("YYYY-MM");

const safeSessionStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(name);
  },
};

export const useDashboardPeriodStore = create<DashboardPeriodState>()(
  persist(
    (set) => ({
      referenceMonth: getDefaultReferenceMonth(),
      setReferenceMonth: (value) => set({ referenceMonth: value }),
      resetReferenceMonth: () => set({ referenceMonth: getDefaultReferenceMonth() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeSessionStorage),
    }
  )
);
