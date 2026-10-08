import type { FieldErrors } from "@/lib/auth/form-state"

export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_HINT = `Must be at least ${PASSWORD_MIN_LENGTH} characters.`

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

function validateNewPassword(password: string) {
  if (!password) return "Enter a password."
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
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
