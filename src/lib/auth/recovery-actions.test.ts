import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import {
  createResetPasswordAction,
  forgotPasswordAction,
  INVALID_RESET_LINK_MESSAGE,
} from "@/lib/auth/auth.actions"
import { forgotPassword, resetPassword } from "@/lib/auth/auth.api"
import { initialAuthFormState } from "@/lib/auth/form-state"

vi.mock("@/lib/auth/auth.api")
vi.mock("@/lib/auth/auth-store")

function formWith(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

describe("forgotPasswordAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("requests a link for the trimmed email and shows the API's neutral message", async () => {
    vi.mocked(forgotPassword).mockResolvedValue({
      message: "If an account exists, a link has been sent.",
    })

    const state = await forgotPasswordAction(
      initialAuthFormState,
      formWith({ email: "  ada@example.com " })
    )

    expect(forgotPassword).toHaveBeenCalledWith("ada@example.com")
    expect(state).toEqual({
      status: "success",
      message: "If an account exists, a link has been sent.",
    })
  })

  it("reports rate limiting and connection problems", async () => {
    vi.mocked(forgotPassword).mockRejectedValue(
      new ApiError(429, ["ThrottlerException"])
    )

    const state = await forgotPasswordAction(
      initialAuthFormState,
      formWith({ email: "ada@example.com" })
    )

    expect(state).toEqual({
      status: "error",
      message: "Too many attempts. Please wait a minute and try again.",
    })
  })
})

describe("createResetPasswordAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("submits the bound token with the new password untouched", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ message: "Password reset." })

    const state = await createResetPasswordAction("link-token")(
      initialAuthFormState,
      formWith({ password: " New-Passw0rd-1 ", confirmPassword: "ignored" })
    )

    expect(resetPassword).toHaveBeenCalledWith("link-token", " New-Passw0rd-1 ")
    expect(state).toEqual({ status: "success", message: "Password reset." })
  })

  it("tells the user to request a new link when the token is rejected", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new ApiError(400, ["Invalid or expired token"])
    )

    const state = await createResetPasswordAction("old-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state).toEqual({
      status: "error",
      message: INVALID_RESET_LINK_MESSAGE,
    })
  })

  it("shows other API messages, such as a password the server rejects", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new ApiError(400, ["password must contain a number"])
    )

    const state = await createResetPasswordAction("link-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state).toEqual({
      status: "error",
      message: "password must contain a number",
    })
  })

  it("does not leak server internals", async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new ApiError(500, ["stack trace"])
    )

    const state = await createResetPasswordAction("link-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state.message).toBe(
      "Something went wrong on our side. Please try again shortly."
    )
  })
})
