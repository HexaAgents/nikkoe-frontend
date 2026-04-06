/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, ReactNode } from "react";
import { analytics } from "@/lib/analytics";
import { apiFetch, setStoredToken, clearStoredToken, getStoredToken } from "@/lib/api";

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
const API_BASE = _rawAuth.replace(/^http:\/\/(?!localhost)/, "https://");

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up old Supabase SDK session keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        localStorage.removeItem(key);
      }
    });

    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<AuthMeResponse>("/auth/me")
      .then((data) => {
        setUser(data.user);
        setSession({ access_token: token, refresh_token: "", expires_in: 0, token_type: "bearer" });
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authPost<AuthSessionResponse>("/auth/login", { email, password });

      if (data.session) {
        setStoredToken(data.session.access_token);
        setSession(data.session);
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
        setStoredToken(data.session.access_token);
        setSession(data.session);
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
