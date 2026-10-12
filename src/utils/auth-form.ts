import type { AuthFormState, FieldErrors } from "@/types/form-state"

export const initialAuthFormState = {
  status: "idle",
} satisfies AuthFormState<string>

export function hasFieldErrors<Field extends string>(
  errors: FieldErrors<Field>
) {
  return Object.values(errors).some(Boolean)
}
