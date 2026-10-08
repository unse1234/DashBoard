"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthLink } from "@/components/auth/auth-link"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import type { AuthFormAction } from "@/lib/auth/form-state"
import { validateLogin, type LoginField } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

type LoginFormProps = {
  action?: AuthFormAction<LoginField>
}

export function LoginForm({ action }: LoginFormProps) {
  const form = useAuthForm({ action, validate: validateLogin })

  return (
    <AuthForm form={form} submitLabel="Log in" pendingLabel="Logging in…">
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
        autoComplete="current-password"
        required
        error={form.fieldErrors.password}
      />
      <AuthLink href={routes.forgotPassword} className="self-end text-sm">
        Forgot password?
      </AuthLink>
    </AuthForm>
  )
}
