import { startTransition, useActionState, useState, type FormEvent } from "react"

import {
  hasFieldErrors,
  initialAuthFormState,
  type AuthFormAction,
  type AuthFormState,
  type FieldErrors,
} from "@/lib/auth/form-state"

type UseAuthFormOptions<Field extends string> = {
  /** Server Action to run once client-side validation passes. */
  action?: AuthFormAction<Field>
  validate: (formData: FormData) => FieldErrors<Field>
}

export type AuthFormController<Field extends string> = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  status: AuthFormState<Field>["status"]
  message?: string
  fieldErrors: FieldErrors<Field>
}

// Stable reference so consumers can safely react to error changes.
const noFieldErrors: FieldErrors<never> = {}

// Used until a real action is connected: valid submissions simply settle.
async function settleIdle<Field extends string>(): Promise<AuthFormState<Field>> {
  return initialAuthFormState
}

export function useAuthForm<Field extends string>({
  action,
  validate,
}: UseAuthFormOptions<Field>): AuthFormController<Field> {
  const [clientErrors, setClientErrors] = useState<FieldErrors<Field> | null>(
    null
  )
  const [state, dispatch, pending] = useActionState<
    AuthFormState<Field>,
    FormData
  >(action ?? settleIdle, initialAuthFormState)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Dispatching manually (instead of `<form action>`) keeps the user's
    // input intact when a submission comes back with errors.
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const errors = validate(formData)

    if (hasFieldErrors(errors)) {
      setClientErrors(errors)
      return
    }

    setClientErrors(null)
    startTransition(() => dispatch(formData))
  }

  return {
    onSubmit,
    pending,
    status: clientErrors ? "error" : state.status,
    message: clientErrors ? undefined : state.message,
    fieldErrors: clientErrors ?? state.fieldErrors ?? noFieldErrors,
  }
}
