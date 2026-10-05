"use client"

import { useId } from "react"

import { AuthField } from "@/components/auth/auth-field"
import { AuthForm } from "@/components/auth/auth-form"
import { AuthLink } from "@/components/auth/auth-link"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import type { AuthFormAction } from "@/lib/auth/form-state"
import { validateLogin, type LoginField } from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

type LoginFormProps = {
  action?: AuthFormAction<LoginField>
}

export function LoginForm({ action }: LoginFormProps) {
  const form = useAuthForm({ action, validate: validateLogin })
  const rememberId = useId()

  return (
    <AuthForm form={form} submitLabel="Log in" pendingLabel="Logging in…">
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
        autoComplete="current-password"
        required
        error={form.fieldErrors.password}
      />
      <div className="flex items-center justify-between gap-4">
        <Field orientation="horizontal" className="w-auto">
          <Checkbox id={rememberId} name="remember" />
          <FieldLabel htmlFor={rememberId} className="font-normal">
            Remember me
          </FieldLabel>
        </Field>
        <AuthLink href={routes.forgotPassword} className="text-sm">
          Forgot password?
        </AuthLink>
      </div>
    </AuthForm>
  )
}
