import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tokenStorage } from '@/api/client';
import { authApi, type PublicUser } from '@/api/auth.api';

interface AuthState {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: PublicUser, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  setUser: (user: PublicUser) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user, accessToken, refreshToken) => {
        tokenStorage.set(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
          authApi.signOut(refreshToken).catch(() => {});
        }
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
      hydrate: async () => {
        if (get().isAuthenticated) return;

        set({ isLoading: true });
        try {
          // 1️⃣ Try with whatever access token we have (may be expired)
          const token = tokenStorage.getAccess();
          if (token) {
            try {
              const res = await authApi.getMe();
              if (res.success && res.data) {
                set({ user: res.data, isAuthenticated: true });
                return; // ✅ Still valid — done
              }
            } catch {
              // Access token expired — fall through to refresh
            }
          }

          // 2️⃣ Access token missing or expired — try the refresh token
          const refreshToken = tokenStorage.getRefresh();
          if (!refreshToken) {
            // No refresh token either — truly logged out
            tokenStorage.clear();
            set({ user: null, isAuthenticated: false });
            return;
          }

          const { request } = await import('@/api/client');
          const refreshRes = await request<{
            tokens: { accessToken: string; refreshToken: string };
          }>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshRes.success || !refreshRes.data) {
            // Refresh token also expired/revoked
            tokenStorage.clear();
            set({ user: null, isAuthenticated: false });
            return;
          }

          const { accessToken: newAccess, refreshToken: newRefresh } =
            refreshRes.data.tokens;
          tokenStorage.set(newAccess, newRefresh);

          // 3️⃣ Now fetch the user with the fresh access token
          const meRes = await authApi.getMe();
          if (meRes.success && meRes.data) {
            set({ user: meRes.data, isAuthenticated: true });
          } else {
            tokenStorage.clear();
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
