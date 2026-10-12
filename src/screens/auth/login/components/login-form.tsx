"use client"

import { useMemo } from "react"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthLink } from "@/components/auth/auth-link"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import { createLoginAction } from "@/lib/auth/auth.actions"
import { useLoginMutation } from "@/hooks/auth/auth.mutations"
import type { AuthFormAction } from "@/types/form-state"
import { validateLogin } from "@/validations/auth.validation";
import { type LoginField } from "@/types/form-state";
import { routes } from "@/config/routes"

type LoginFormProps = {
  action?: AuthFormAction<LoginField>
}

export function LoginForm({ action }: LoginFormProps) {
  const { mutateAsync: login } = useLoginMutation()
  const loginAction = useMemo(() => createLoginAction(login), [login])
  const form = useAuthForm({
    action: action ?? loginAction,
    validate: validateLogin,
  })

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
