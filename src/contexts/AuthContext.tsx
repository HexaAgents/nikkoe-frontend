/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { analytics } from "@/lib/analytics";
import {
  apiFetch,
  setStoredToken,
  setStoredRefreshToken,
  clearStoredToken,
  getStoredToken,
  getStoredRefreshToken,
} from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface AuthSessionResponse {
  user: AuthUser;
  session: AuthSession | null;
}

interface AuthMeResponse {
  user: AuthUser;
  profile: { user_id: string; name: string; email_address: string | null } | null;
}

export interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ user: AuthUser | null; error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const _rawAuth = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_BASE = _rawAuth.replace(/^http:\/\/(?!localhost|127\.|192\.168\.|10\.)/, "https://");

async function authPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || `Request failed: ${res.status}`);
  }
  return data as T;
}

interface RefreshResponse {
  session: AuthSession;
}

const REFRESH_MARGIN_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const persistSession = useCallback((sess: AuthSession) => {
    setStoredToken(sess.access_token);
    setStoredRefreshToken(sess.refresh_token);
    setSession(sess);
  }, []);

  const scheduleRefresh = useCallback((expiresInSec: number, refreshToken: string) => {
    clearTimeout(refreshTimerRef.current);
    const delayMs = Math.max((expiresInSec * 1000) - REFRESH_MARGIN_MS, 10_000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await authPost<RefreshResponse>("/auth/refresh", { refresh_token: refreshToken });
        persistSession(data.session);
        scheduleRefresh(data.session.expires_in, data.session.refresh_token);
      } catch {
        clearStoredToken();
        setSession(null);
        setUser(null);
      }
    }, delayMs);
  }, [persistSession]);

  useEffect(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        localStorage.removeItem(key);
      }
    });

    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();

    if (!token) {
      if (refreshToken) {
        authPost<RefreshResponse>("/auth/refresh", { refresh_token: refreshToken })
          .then((data) => {
            persistSession(data.session);
            scheduleRefresh(data.session.expires_in, data.session.refresh_token);
            return apiFetch<AuthMeResponse>("/auth/me");
          })
          .then((me) => setUser(me.user))
          .catch(() => clearStoredToken())
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

    apiFetch<AuthMeResponse>("/auth/me")
      .then((data) => {
        setUser(data.user);
        const sess: AuthSession = {
          access_token: token,
          refresh_token: refreshToken ?? "",
          expires_in: 3600,
          token_type: "bearer",
        };
        setSession(sess);
        if (refreshToken) scheduleRefresh(sess.expires_in, refreshToken);
      })
      .catch(async () => {
        if (refreshToken) {
          try {
            const data = await authPost<RefreshResponse>("/auth/refresh", { refresh_token: refreshToken });
            persistSession(data.session);
            scheduleRefresh(data.session.expires_in, data.session.refresh_token);
            const me = await apiFetch<AuthMeResponse>("/auth/me");
            setUser(me.user);
            return;
          } catch { /* fall through */ }
        }
        clearStoredToken();
      })
      .finally(() => setLoading(false));

    return () => clearTimeout(refreshTimerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authPost<AuthSessionResponse>("/auth/login", { email, password });

      if (data.session) {
        persistSession(data.session);
        scheduleRefresh(data.session.expires_in, data.session.refresh_token);
      }

      setUser(data.user);
      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await authPost<AuthSessionResponse>("/auth/signup", { email, password });

      if (data.session) {
        persistSession(data.session);
        scheduleRefresh(data.session.expires_in, data.session.refresh_token);
      }

      setUser(data.user);
      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    analytics.track("user_signed_out");
    analytics.reset();
    clearTimeout(refreshTimerRef.current);
    clearStoredToken();
    setSession(null);
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = getStoredToken();
      await authPost("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }, token);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "@/hooks/useAuth";
