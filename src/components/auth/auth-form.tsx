"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

import type { AuthFormController } from "@/components/auth/use-auth-form"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { AuthFormState } from "@/lib/auth/form-state"

type AuthFormMessageProps = {
  status: AuthFormState<string>["status"]
  message?: string
}

/** Form-level feedback (e.g. invalid credentials, "reset link sent"). */
export function AuthFormMessage({ status, message }: AuthFormMessageProps) {
  if (!message || status === "idle") return null

  const isError = status === "error"

  return (
    <Alert
      variant={isError ? "destructive" : "default"}
      role={isError ? "alert" : "status"}
    >
      {isError ? (
        <CircleAlertIcon aria-hidden="true" />
      ) : (
        <CircleCheckIcon aria-hidden="true" />
      )}
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  )
}

type AuthFormProps = {
  form: AuthFormController<string>
  submitLabel: string
  pendingLabel: string
  children: ReactNode
}

/**
 * Shared frame for every auth form: feedback message, fields and a full-width
 * submit button. All controls are disabled while a submission is pending, and
 * focus moves to the first invalid field whenever new errors are shown.
 */
export function AuthForm({
  form,
  submitLabel,
  pendingLabel,
  children,
}: AuthFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLElement>("[aria-invalid='true']")
      ?.focus()
  }, [form.fieldErrors])

  return (
    <form ref={formRef} onSubmit={form.onSubmit} noValidate>
      <fieldset disabled={form.pending} className="flex min-w-0 flex-col gap-6">
        <AuthFormMessage status={form.status} message={form.message} />
        <FieldGroup>{children}</FieldGroup>
        <Button type="submit" size="lg" className="w-full">
          {form.pending ? (
            <>
              <Spinner aria-hidden="true" />
              {pendingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </fieldset>
    </form>
  )
}
