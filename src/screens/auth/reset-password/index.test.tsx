import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { resetPassword } from "@/lib/auth/auth.api"
import { ResetPasswordScreen } from "@/screens/auth/reset-password"

vi.mock("@/lib/auth/auth.api")
vi.mock("@/lib/auth/auth-store")

describe("ResetPasswordScreen", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("offers a new link instead of a form when the link has no token", () => {
    render(<ResetPasswordScreen />)

    expect(
      screen.getByRole("heading", { name: "Reset link not valid" })
    ).toBeVisible()
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Request a new link" })
    ).toHaveAttribute("href", "/forgot-password")
  })

  it("rejects a password that breaks the policy without calling the API", async () => {
    render(<ResetPasswordScreen token="link-token" />)

    await userEvent.type(screen.getByLabelText("New password"), "short")
    await userEvent.type(screen.getByLabelText("Confirm new password"), "short")
    await userEvent.click(
      screen.getByRole("button", { name: "Reset password" })
    )

    // The field's description is its hint plus the error.
    expect(screen.getByLabelText("New password")).toHaveAccessibleDescription(
      /Password must be at least 12 characters\./
    )
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it("submits the link's token and then offers to continue to log in", async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      message: "Your password has been reset. You can now sign in.",
    })
    render(<ResetPasswordScreen token="link-token" />)

    await userEvent.type(
      screen.getByLabelText("New password"),
      "Valid-Passw0rd-1"
    )
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "Valid-Passw0rd-1"
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Reset password" })
    )

    expect(
      await screen.findByRole("link", { name: "Continue to log in" })
    ).toHaveAttribute("href", "/login")
    expect(resetPassword).toHaveBeenCalledWith("link-token", "Valid-Passw0rd-1")
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your password has been reset. You can now sign in."
    )
  })
})
