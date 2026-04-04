import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Signup from "@/pages/Signup";
import { createMockAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

describe("Signup Page", () => {
  it("renders email, password, confirm password fields and create button", () => {
    renderWithProviders(<Signup />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("does not call signUp when passwords do not match", async () => {
    const auth = createMockAuthContext();
    renderWithProviders(<Signup />, { auth });

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "different456");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("does not call signUp when password is too short", async () => {
    const auth = createMockAuthContext();
    renderWithProviders(<Signup />, { auth });

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "abc");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "abc");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("calls signUp with valid matching passwords", async () => {
    const auth = createMockAuthContext({
      signUp: vi.fn().mockResolvedValue({
        user: { id: "new-user", email: "test@example.com" },
        error: null,
      }),
    });
    renderWithProviders(<Signup />, { auth });

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "validpass123");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "validpass123");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(auth.signUp).toHaveBeenCalledWith("test@example.com", "validpass123");
    });
  });

  it("has a link to the login page", () => {
    renderWithProviders(<Signup />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
