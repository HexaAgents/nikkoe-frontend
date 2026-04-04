/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || `Request failed: ${res.status}`);
  }
  return data as T;
}

interface AuthSessionResponse {
  user: { id: string; email: string };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  } | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: { id: string; email: string } | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ user: { id: string; email: string } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authFetch<AuthSessionResponse>("/auth/login", { email, password });

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await authFetch<AuthSessionResponse>("/auth/signup", { email, password });

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return { user: data.user, error: null };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    analytics.track("user_signed_out");
    analytics.reset();
    await supabase.auth.signOut();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authFetch("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
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
