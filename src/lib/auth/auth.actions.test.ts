import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { createLoginAction } from "@/lib/auth/auth.actions"
import { initialAuthFormState } from "@/lib/auth/form-state"

function credentials(email: string, password: string) {
  const data = new FormData()
  data.set("email", email)
  data.set("password", password)
  return data
}

describe("createLoginAction", () => {
  const login = vi.fn()

  beforeEach(() => {
    login.mockReset()
  })

  it("signs in with the trimmed email and untouched password", async () => {
    login.mockResolvedValue(undefined)

    const state = await createLoginAction(login)(
      initialAuthFormState,
      credentials("  ada@example.com ", " pass word ")
    )

    expect(login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: " pass word ",
    })
    expect(state).toEqual({ status: "success" })
  })

  it("shows the API's message for invalid credentials", async () => {
    login.mockRejectedValue(new ApiError(401, ["Invalid email or password"]))

    const state = await createLoginAction(login)(
      initialAuthFormState,
      credentials("ada@example.com", "wrong")
    )

    expect(state).toEqual({
      status: "error",
      message: "Invalid email or password",
    })
  })

  it.each([
    [429, "Too many attempts. Please wait a minute and try again."],
    [500, "Something went wrong on our side. Please try again shortly."],
    [0, "Unable to reach the server."],
  ])("describes a %i failure for the user", async (status, message) => {
    login.mockRejectedValue(new ApiError(status, [message]))

    const state = await createLoginAction(login)(
      initialAuthFormState,
      credentials("ada@example.com", "x")
    )

    expect(state).toEqual({ status: "error", message })
  })

  it("hides unexpected errors behind a generic message", async () => {
    login.mockRejectedValue(new TypeError("x is not a function"))

    const state = await createLoginAction(login)(
      initialAuthFormState,
      credentials("ada@example.com", "x")
    )

    expect(state).toEqual({
      status: "error",
      message: "Something went wrong. Please try again.",
    })
  })
})
