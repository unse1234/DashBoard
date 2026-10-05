"use client"

import Link from "next/link"

import { AuthField } from "@/components/auth/auth-field"
import { AuthForm, AuthFormMessage } from "@/components/auth/auth-form"
import { useAuthForm } from "@/components/auth/use-auth-form"
import { buttonVariants } from "@/components/ui/button"
import type { AuthFormAction } from "@/lib/auth/form-state"
import {
  PASSWORD_MIN_LENGTH,
  validateResetPassword,
  type ResetPasswordField,
} from "@/lib/auth/validation"
import { routes } from "@/lib/routes"

type ResetPasswordFormProps = {
  action?: AuthFormAction<ResetPasswordField>
}

export function ResetPasswordForm({ action }: ResetPasswordFormProps) {
  const form = useAuthForm({ action, validate: validateResetPassword })

  if (form.status === "success") {
    return (
      <div className="flex flex-col gap-6">
        <AuthFormMessage
          status="success"
          message={form.message ?? "Your password has been reset."}
        />
        <Link href={routes.login} className={buttonVariants({ size: "lg", className: "w-full" })}>
          Continue to log in
        </Link>
      </div>
    )
  }

  return (
    <AuthForm form={form} submitLabel="Reset password" pendingLabel="Resetting password…">
      <AuthField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        description={`Must be at least ${PASSWORD_MIN_LENGTH} characters.`}
        error={form.fieldErrors.password}
      />
      <AuthField
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
