"use client"

import { useMemo } from "react"
import Link from "next/link"

import { AuthForm, AuthFormMessage } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { FormField } from "@/components/shared/form-field"
import { buttonVariants } from "@/components/ui/button"
import { createResetPasswordAction } from "@/lib/auth/auth.actions"
import type { AuthFormAction } from "@/lib/auth/form-state"
import {
  PASSWORD_HINT,
  validateResetPassword,
  type ResetPasswordField,
} from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

type ResetPasswordFormProps = {
  /** From the emailed link; used to build the default action. */
  token?: string
  action?: AuthFormAction<ResetPasswordField>
}

export function ResetPasswordForm({ token, action }: ResetPasswordFormProps) {
  const tokenAction = useMemo(
    () => (token ? createResetPasswordAction(token) : undefined),
    [token]
  )
  const form = useAuthForm({
    action: action ?? tokenAction,
    validate: validateResetPassword,
  })

  if (form.status === "success") {
    return (
      <div className="flex flex-col gap-6">
        <AuthFormMessage
          status="success"
          message={form.message ?? "Your password has been reset."}
        />
        <Link
          href={routes.login}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Continue to log in
        </Link>
      </div>
    )
  }

  return (
    <AuthForm
      form={form}
      submitLabel="Reset password"
      pendingLabel="Resetting password…"
    >
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        description={PASSWORD_HINT}
        error={form.fieldErrors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={form.fieldErrors.confirmPassword}
      />
    </AuthForm>
  )
}
