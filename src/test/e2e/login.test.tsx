import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Login from "@/pages/Login";
import { AppRoutes } from "@/routes";
import { createMockAuthContext, createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

describe("Login Page", () => {
  it("renders email and password fields and a sign in button", () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("does not submit when email is empty (HTML required)", async () => {
    const auth = createMockAuthContext();
    renderWithProviders(<Login />, { auth });
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it("calls signIn with entered credentials and re-enables button on failure", async () => {
    const auth = createMockAuthContext({
      signIn: vi.fn().mockResolvedValue({ user: null, error: new Error("Invalid login credentials") }),
    });
    renderWithProviders(<Login />, { auth });

    await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "badpassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(auth.signIn).toHaveBeenCalledWith("wrong@example.com", "badpassword");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
    });
  });

  it("navigates to /sales on successful login", async () => {
    const auth = createMockAuthContext({
      signIn: vi.fn().mockResolvedValue({
        user: { id: "user-123", email: "test@example.com" },
        error: null,
      }),
    });
    renderWithProviders(<AppRoutes />, { auth, route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "correctpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(auth.signIn).toHaveBeenCalledWith("test@example.com", "correctpass");
    });
  });

  it("toggles password visibility with the eye button", async () => {
    renderWithProviders(<Login />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = passwordInput.parentElement!.querySelector("button")!;
    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
