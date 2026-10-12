import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/constants/auth.constants"
import type { LoginField, ForgotPasswordField, ResetPasswordField, FieldErrors } from "@/types/form-state"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
