import { hasFieldErrors } from "@/lib/auth/form-state"
import {
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "@/lib/auth/validation"

function formData(values: Record<string, string>) {
  const data = new FormData()
  for (const [name, value] of Object.entries(values)) data.set(name, value)
  return data
}

describe("auth validation", () => {
  it("requires a valid email and a password to log in", () => {
    expect(validateLogin(formData({ email: "", password: "" }))).toEqual({
      email: "Enter your email address.",
      password: "Enter your password.",
    })
    expect(validateLogin(formData({ email: "not-an-email", password: "x" })).email).toBe(
      "Enter a valid email address."
    )
    expect(
      hasFieldErrors(validateLogin(formData({ email: " ada@example.com ", password: "x" })))
    ).toBe(false)
  })

  it("enforces password length and confirmation when registering", () => {
    const errors = validateRegister(
      formData({ name: " ", email: "ada@example.com", password: "short", confirmPassword: "other" })
    )

    expect(errors).toEqual({
      name: "Enter your name.",
      email: undefined,
      password: "Password must be at least 8 characters.",
      confirmPassword: "Passwords do not match.",
    })
  })

  it("accepts valid forgot and reset password submissions", () => {
    expect(hasFieldErrors(validateForgotPassword(formData({ email: "ada@example.com" })))).toBe(false)
    expect(
      hasFieldErrors(
        validateResetPassword(formData({ password: "long-enough", confirmPassword: "long-enough" }))
      )
    ).toBe(false)
  })
})
