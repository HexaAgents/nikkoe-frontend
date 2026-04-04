import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { createLoggedInAuthContext, renderWithProviders } from "./helpers";

vi.mock("@/lib/analytics", () => ({
  analytics: { identify: vi.fn(), track: vi.fn(), reset: vi.fn() },
}));

function getFields() {
  return {
    current: document.getElementById("currentPassword") as HTMLInputElement,
    newPw: document.getElementById("newPassword") as HTMLInputElement,
    confirm: document.getElementById("confirmPassword") as HTMLInputElement,
    submit: screen.getByRole("button", { name: /update password/i }),
  };
}

describe("Change Password Form", () => {
  it("renders current, new, and confirm password fields", () => {
    renderWithProviders(<ChangePasswordForm />, { auth: createLoggedInAuthContext() });
    const { current, newPw, confirm, submit } = getFields();
    expect(current).toBeInTheDocument();
    expect(newPw).toBeInTheDocument();
    expect(confirm).toBeInTheDocument();
    expect(submit).toBeInTheDocument();
  });

  it("does not call changePassword when new password is too short", async () => {
    const auth = createLoggedInAuthContext();
    renderWithProviders(<ChangePasswordForm />, { auth });
    const { current, newPw, confirm, submit } = getFields();

    await userEvent.type(current, "oldpass123");
    await userEvent.type(newPw, "abc");
    await userEvent.type(confirm, "abc");
    await userEvent.click(submit);

    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("does not call changePassword when new passwords do not match", async () => {
    const auth = createLoggedInAuthContext();
    renderWithProviders(<ChangePasswordForm />, { auth });
    const { current, newPw, confirm, submit } = getFields();

    await userEvent.type(current, "oldpass123");
    await userEvent.type(newPw, "newpass123");
    await userEvent.type(confirm, "different456");
    await userEvent.click(submit);

    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("calls changePassword with valid matching passwords", async () => {
    const auth = createLoggedInAuthContext({
      changePassword: vi.fn().mockResolvedValue({ error: null }),
    });
    renderWithProviders(<ChangePasswordForm />, { auth });
    const { current, newPw, confirm, submit } = getFields();

    await userEvent.type(current, "oldpass123");
    await userEvent.type(newPw, "newpass123");
    await userEvent.type(confirm, "newpass123");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(auth.changePassword).toHaveBeenCalledWith("oldpass123", "newpass123");
    });
  });
});
