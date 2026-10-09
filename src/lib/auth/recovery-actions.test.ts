import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import {
  createForgotPasswordAction,
  createResetPasswordAction,
  INVALID_RESET_LINK_MESSAGE,
} from "@/lib/auth/auth.actions"
import { initialAuthFormState } from "@/lib/auth/form-state"

function formWith(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

describe("createForgotPasswordAction", () => {
  const requestLink = vi.fn()

  beforeEach(() => {
    requestLink.mockReset()
  })

  it("requests a link for the trimmed email and shows the API's neutral message", async () => {
    requestLink.mockResolvedValue({
      message: "If an account exists, a link has been sent.",
    })

    const state = await createForgotPasswordAction(requestLink)(
      initialAuthFormState,
      formWith({ email: "  ada@example.com " })
    )

    expect(requestLink).toHaveBeenCalledWith("ada@example.com")
    expect(state).toEqual({
      status: "success",
      message: "If an account exists, a link has been sent.",
    })
  })

  it("reports rate limiting", async () => {
    requestLink.mockRejectedValue(new ApiError(429, ["ThrottlerException"]))

    const state = await createForgotPasswordAction(requestLink)(
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
  const resetPassword = vi.fn()

  beforeEach(() => {
    resetPassword.mockReset()
  })

  it("submits the bound token with the new password untouched", async () => {
    resetPassword.mockResolvedValue({ message: "Password reset." })

    const state = await createResetPasswordAction(resetPassword, "link-token")(
      initialAuthFormState,
      formWith({ password: " New-Passw0rd-1 ", confirmPassword: "ignored" })
    )

    expect(resetPassword).toHaveBeenCalledWith({
      token: "link-token",
      password: " New-Passw0rd-1 ",
    })
    expect(state).toEqual({ status: "success", message: "Password reset." })
  })

  it("tells the user to request a new link when the token is rejected", async () => {
    resetPassword.mockRejectedValue(
      new ApiError(400, ["Invalid or expired token"])
    )

    const state = await createResetPasswordAction(resetPassword, "old-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state).toEqual({
      status: "error",
      message: INVALID_RESET_LINK_MESSAGE,
    })
  })

  it("shows other API messages, such as a password the server rejects", async () => {
    resetPassword.mockRejectedValue(
      new ApiError(400, ["password must contain a number"])
    )

    const state = await createResetPasswordAction(resetPassword, "link-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state).toEqual({
      status: "error",
      message: "password must contain a number",
    })
  })

  it("does not leak server internals", async () => {
    resetPassword.mockRejectedValue(new ApiError(500, ["stack trace"]))

    const state = await createResetPasswordAction(resetPassword, "link-token")(
      initialAuthFormState,
      formWith({ password: "New-Passw0rd-1" })
    )

    expect(state.message).toBe(
      "Something went wrong on our side. Please try again shortly."
    )
  })
})
