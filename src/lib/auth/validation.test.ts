import { hasFieldErrors } from "@/lib/auth/form-state"
import {
  validateForgotPassword,
  validateLogin,
  validateNewPassword,
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

  it("accepts valid forgot and reset password submissions", () => {
    expect(hasFieldErrors(validateForgotPassword(formData({ email: "ada@example.com" })))).toBe(false)
    expect(
      hasFieldErrors(
        validateResetPassword(formData({ password: "Long-enough-1", confirmPassword: "Long-enough-1" }))
      )
    ).toBe(false)
  })

  it("applies the API's password policy to new passwords", () => {
    expect(validateNewPassword("")).toBe("Enter a password.")
    expect(validateNewPassword("Short1a")).toBe(
      "Password must be at least 12 characters."
    )
    expect(validateNewPassword(`Aa1${"x".repeat(126)}`)).toBe(
      "Password must be 128 characters or fewer."
    )
    expect(validateNewPassword("ALLUPPERCASE123")).toBe(
      "Password must contain a lowercase letter."
    )
    expect(validateNewPassword("alllowercase123")).toBe(
      "Password must contain an uppercase letter."
    )
    expect(validateNewPassword("NoDigitsInHere")).toBe(
      "Password must contain a number."
    )
    expect(validateNewPassword("Valid-Passw0rd-1")).toBeUndefined()
  })

  it("reports a mismatched confirmation on reset", () => {
    const errors = validateResetPassword(
      formData({
        password: "Valid-Passw0rd-1",
        confirmPassword: "Other-Passw0rd-1",
      })
    )
    expect(errors).toEqual({
      password: undefined,
      confirmPassword: "Passwords do not match.",
    })
  })
})
