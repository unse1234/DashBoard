"use client"

import { useMemo } from "react"

import { AuthForm } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import { createForgotPasswordAction } from "@/lib/auth/auth.actions"
import { useForgotPasswordMutation } from "@/lib/auth/auth.mutations"
import type { AuthFormAction } from "@/types/form-state"
import { validateForgotPassword } from "@/validations/auth.validation";
import { type ForgotPasswordField } from "@/types/form-state";

type ForgotPasswordFormProps = {
  action?: AuthFormAction<ForgotPasswordField>
}

/**
 * On success the form stays visible with the confirmation message above it,
 * so the user can correct the address or request another link.
 */
export function ForgotPasswordForm({ action }: ForgotPasswordFormProps) {
  const { mutateAsync: requestLink } = useForgotPasswordMutation()
  const forgotPasswordAction = useMemo(
    () => createForgotPasswordAction(requestLink),
    [requestLink]
  )
  const form = useAuthForm({
    action: action ?? forgotPasswordAction,
    validate: validateForgotPassword,
  })

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
