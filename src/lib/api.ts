const _raw = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BASE_URL = _raw.replace(/^http:\/\/(?!localhost)/, "https://");

const TOKEN_KEY = "nikkoe_access_token";
const REFRESH_KEY = "nikkoe_refresh_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    setStoredToken(data.session.access_token);
    setStoredRefreshToken(data.session.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = tryRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
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

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      const newToken = getStoredToken();
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options.headers,
        },
      });
      if (retry.ok) return retry.json();
    }
  }

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

/**
 * Fetch every row for a paginated endpoint, batching in chunks of 5 000.
 * Used by the Excel export so it gets the full dataset, not just one page.
 */
export async function fetchAllPages<T>(
  basePath: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const BATCH = 5000;
  const qs = new URLSearchParams({ ...params, limit: String(BATCH), offset: "0" });

  const first = await apiFetch<PaginatedResponse<T>>(`${basePath}?${qs}`);
  if (first.total <= BATCH) return first.data;

  const promises: Promise<PaginatedResponse<T>>[] = [];
  for (let offset = BATCH; offset < first.total; offset += BATCH) {
    const nextQs = new URLSearchParams({ ...params, limit: String(BATCH), offset: String(offset) });
    promises.push(apiFetch<PaginatedResponse<T>>(`${basePath}?${nextQs}`));
  }
  const rest = await Promise.all(promises);
  return [first.data, ...rest.map((r) => r.data)].flat();
}

export async function apiUpload<T = unknown>(path: string, file: File): Promise<T> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface StreamParseCallbacks {
  onHeader: (h: {
    supplier_name: string | null;
    matched_supplier_id: number | null;
    reference: string | null;
    currency_symbol: string | null;
    shipping_total?: number | null;
    total_lines?: number;
  }) => void;
  onLine: (line: {
    part_number: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    matched_item_id: number | null;
    matched_item_name: string | null;
    matched_location_id: number | null;
    matched_location_code: string | null;
  }) => void;
  onDone: (d: { total: number }) => void;
  onError: (msg: string) => void;
}

export async function streamParseInvoice(file: File, cb: StreamParseCallbacks): Promise<void> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/receipts/parse-invoice/stream`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `Request failed: ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop()!;

    for (const chunk of parts) {
      if (!chunk.trim()) continue;
      let evt = "message";
      let data = "";
      for (const ln of chunk.split("\n")) {
        if (ln.startsWith("event: ")) evt = ln.slice(7).trim();
        else if (ln.startsWith("data: ")) data += ln.slice(6);
      }
      if (!data) continue;
      const parsed = JSON.parse(data);

      if (evt === "header") cb.onHeader(parsed);
      else if (evt === "line") cb.onLine(parsed);
      else if (evt === "done") cb.onDone(parsed);
      else if (evt === "error") cb.onError(parsed.error);
    }
  }
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
