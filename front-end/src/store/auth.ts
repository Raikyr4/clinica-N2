import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserResponse } from "@/types/api";
import { useDashboardPeriodStore } from "@/store/dashboardPeriod";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
  setHasHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

const STORAGE_KEY = "auth-storage";

const clearLegacyAuthStorage = () => {
  if (typeof window === "undefined") return;

  // Remove legado em localStorage para evitar login automático entre sessões
  window.localStorage.removeItem(STORAGE_KEY);
};

clearLegacyAuthStorage();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          hasHydrated: true,
        });

        useDashboardPeriodStore.getState().resetReferenceMonth();
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => window.sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
