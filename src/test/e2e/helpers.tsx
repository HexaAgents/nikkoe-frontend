import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthContextType } from "@/contexts/AuthContext";
import type { Session, User } from "@supabase/supabase-js";

export function createMockAuthContext(
  overrides: Partial<AuthContextType> = {}
): AuthContextType {
  return {
    session: null,
    user: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

export function createLoggedInAuthContext(
  overrides: Partial<AuthContextType> = {}
): AuthContextType {
  return createMockAuthContext({
    session: { access_token: "test-token", refresh_token: "test-refresh" } as Session,
    user: { id: "user-123", email: "test@example.com" } as User,
    ...overrides,
  });
}

interface RenderOptions {
  auth?: AuthContextType;
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { auth, route = "/" }: RenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const authCtx = auth ?? createMockAuthContext();

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authCtx}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
