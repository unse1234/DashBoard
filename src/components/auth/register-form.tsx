"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import type { AuthFormAction } from "@/lib/auth/form-state"
import {
  PASSWORD_HINT,
  validateRegister,
  type RegisterField,
} from "@/lib/auth/validation"

type RegisterFormProps = {
  action?: AuthFormAction<RegisterField>
}

export function RegisterForm({ action }: RegisterFormProps) {
  const form = useAuthForm({ action, validate: validateRegister })

  return (
    <AuthForm
      form={form}
      submitLabel="Create account"
      pendingLabel="Creating account…"
    >
      <FormField
        name="name"
        label="Name"
        autoComplete="name"
        required
        error={form.fieldErrors.name}
      />
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={form.fieldErrors.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        description={PASSWORD_HINT}
        error={form.fieldErrors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        error={form.fieldErrors.confirmPassword}
      />
    </AuthForm>
  )
}
