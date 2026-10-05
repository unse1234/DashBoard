export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

export type AuthFormState<Field extends string> = {
  status: "idle" | "error" | "success"
  /** Form-level feedback, e.g. "Invalid email or password." */
  message?: string
  fieldErrors?: FieldErrors<Field>
}

/**
 * Signature expected from the (future) auth Server Actions so they can be
 * passed straight to the auth forms and used with `useActionState`.
 */
export type AuthFormAction<Field extends string> = (
  state: AuthFormState<Field>,
  formData: FormData
) => Promise<AuthFormState<Field>>

export const initialAuthFormState = {
  status: "idle",
} satisfies AuthFormState<string>

export function hasFieldErrors<Field extends string>(
  errors: FieldErrors<Field>
) {
  return Object.values(errors).some(Boolean)
}
