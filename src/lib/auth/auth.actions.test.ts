import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { loginAction } from "@/lib/auth/auth.actions"
import { signIn } from "@/lib/auth/auth-store"
import { initialAuthFormState } from "@/lib/auth/form-state"

vi.mock("@/lib/auth/auth-store")

function credentials(email: string, password: string) {
  const data = new FormData()
  data.set("email", email)
  data.set("password", password)
  return data
}

describe("loginAction", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset()
  })

  it("signs in with the trimmed email and untouched password", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined)

    const state = await loginAction(
      initialAuthFormState,
      credentials("  ada@example.com ", " pass word ")
    )

    expect(signIn).toHaveBeenCalledWith("ada@example.com", " pass word ")
    expect(state).toEqual({ status: "success" })
  })

  it("shows the API's message for invalid credentials", async () => {
    vi.mocked(signIn).mockRejectedValue(
      new ApiError(401, ["Invalid email or password"])
    )

    const state = await loginAction(
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
    vi.mocked(signIn).mockRejectedValue(new ApiError(status, [message]))

    const state = await loginAction(
      initialAuthFormState,
      credentials("ada@example.com", "x")
    )

    expect(state).toEqual({ status: "error", message })
  })

  it("hides unexpected errors behind a generic message", async () => {
    vi.mocked(signIn).mockRejectedValue(new TypeError("x is not a function"))

    const state = await loginAction(
      initialAuthFormState,
      credentials("ada@example.com", "x")
    )

    expect(state).toEqual({
      status: "error",
      message: "Something went wrong. Please try again.",
    })
  })
})
