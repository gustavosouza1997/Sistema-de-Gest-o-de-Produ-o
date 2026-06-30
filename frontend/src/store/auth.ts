import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  accessToken: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
          const { accessToken, user: u } = res.data;
          set({
            user: { sub: u.sub, name: u.name, email: u.email, picture: u.picture, accessToken },
            isLoading: false,
          });
        } catch (err: unknown) {
          const status = (err as any)?.response?.status;
          const msg =
            status === 401
              ? 'Usuário ou senha inválidos.'
              : (err as any)?.response?.data?.message ?? 'Erro ao autenticar. Tente novamente.';
          set({ isLoading: false, error: msg });
        }
      },

      logout: () => set({ user: null, error: null }),
    }),
    {
      name: 'cp-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
