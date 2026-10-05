"use client"

import { AuthField } from "@/components/auth/auth-field"
import { AuthForm } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import type { AuthFormAction } from "@/lib/auth/form-state"
import {
  PASSWORD_MIN_LENGTH,
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
      <AuthField
        name="name"
        label="Name"
        autoComplete="name"
        required
        error={form.fieldErrors.name}
      />
      <AuthField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={form.fieldErrors.email}
      />
      <AuthField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        description={`Must be at least ${PASSWORD_MIN_LENGTH} characters.`}
        error={form.fieldErrors.password}
      />
      <AuthField
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
