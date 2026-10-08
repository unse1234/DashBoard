import type { FieldErrors } from "@/lib/auth/form-state"

// Mirrors the API's password policy; the server remains the source of truth.
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with a lowercase letter, an uppercase letter and a number.`

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginField = "email" | "password"
export type ForgotPasswordField = "email"
export type ResetPasswordField = "password" | "confirmPassword"

function getValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

function validateEmail(value: string) {
  const email = value.trim()
  if (!email) return "Enter your email address."
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address."
}

export function validateNewPassword(password: string) {
  if (!password) return "Enter a password."
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter."
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter."
  }
  if (!/\d/.test(password)) return "Password must contain a number."
}

function validatePasswordConfirmation(password: string, confirmation: string) {
  if (!confirmation) return "Confirm your password."
  if (confirmation !== password) return "Passwords do not match."
}

export function validateLogin(formData: FormData): FieldErrors<LoginField> {
  return {
    email: validateEmail(getValue(formData, "email")),
    password: getValue(formData, "password")
      ? undefined
      : "Enter your password.",
  }
}

export function validateForgotPassword(
  formData: FormData
): FieldErrors<ForgotPasswordField> {
  return { email: validateEmail(getValue(formData, "email")) }
}

export function validateResetPassword(
  formData: FormData
): FieldErrors<ResetPasswordField> {
  const password = getValue(formData, "password")

  return {
    password: validateNewPassword(password),
    confirmPassword: validatePasswordConfirmation(
      password,
      getValue(formData, "confirmPassword")
    ),
  }
}
