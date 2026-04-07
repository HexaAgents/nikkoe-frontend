const _raw = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BASE_URL = _raw.replace(/^http:\/\/(?!localhost)/, "https://");

const TOKEN_KEY = "nikkoe_access_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),

  getList: async <T = unknown>(path: string): Promise<T[]> => {
    const res = await apiFetch<PaginatedResponse<T>>(path);
    return res.data;
  },

  getListPaginated: <T = unknown>(path: string) =>
    apiFetch<PaginatedResponse<T>>(path),

  post: <T = unknown>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),

  put: <T = unknown>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  del: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
