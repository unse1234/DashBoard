export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type AuthFormStatus = "idle" | "error" | "success"

export type AuthFormState<Field extends string> = {
  status: AuthFormStatus
  /** Form-level feedback, e.g. "Invalid email or password." */
  message?: string
  fieldErrors?: FieldErrors<Field>
}

/**
 * Async form callback used with `useActionState`. The current adapters run
 * on the client; this signature does not make them Next.js Server Actions.
 */
export type AuthFormAction<Field extends string> = (
  state: AuthFormState<Field>,
  formData: FormData
) => Promise<AuthFormState<Field>>

export type LoginField = "email" | "password"

export type ForgotPasswordField = "email"

export type ResetPasswordField = "password" | "confirmPassword"
