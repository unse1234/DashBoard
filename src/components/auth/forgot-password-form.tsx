"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import type { AuthFormAction } from "@/lib/auth/form-state"
import {
  validateForgotPassword,
  type ForgotPasswordField,
} from "@/lib/auth/validation"

type ForgotPasswordFormProps = {
  action?: AuthFormAction<ForgotPasswordField>
}

/**
 * On success the form stays visible with the confirmation message above it,
 * so the user can correct the address or request another link.
 */
export function ForgotPasswordForm({ action }: ForgotPasswordFormProps) {
  const form = useAuthForm({ action, validate: validateForgotPassword })

  return (
    <AuthForm
      form={form}
      submitLabel="Send reset link"
      pendingLabel="Sending link…"
    >
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={form.fieldErrors.email}
      />
    </AuthForm>
  )
}
