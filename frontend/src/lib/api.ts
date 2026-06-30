import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('cp-auth');
    if (!raw) return null;
    const { state } = JSON.parse(raw) as { state?: { user?: { accessToken?: string } } };
    return state?.user?.accessToken ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export function setAuthToken(_token: string | undefined) {
  // Token is read dynamically from localStorage on every request via interceptor
}
