import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { forgotPassword } from "@/lib/auth/auth.api"
import { ForgotPasswordForm } from "@/screens/auth/forgot-password/components/forgot-password-form"

vi.mock("@/lib/auth/auth.api")
vi.mock("@/lib/auth/auth-store")

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("validates the address before calling the API", async () => {
    render(<ForgotPasswordForm />)

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email")
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" })
    )

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address."
    )
    expect(forgotPassword).not.toHaveBeenCalled()
  })

  it("shows the neutral confirmation and keeps the form for another attempt", async () => {
    vi.mocked(forgotPassword).mockResolvedValue({
      message:
        "If an account exists for that email address, a link has been sent.",
    })
    render(<ForgotPasswordForm />)

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com")
    await userEvent.click(
      screen.getByRole("button", { name: "Send reset link" })
    )

    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists for that email address, a link has been sent."
    )
    expect(forgotPassword).toHaveBeenCalledWith("ada@example.com")
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com")
  })
})
