import { describeApiError } from "@/lib/api/api-error"
import { signIn } from "@/lib/auth/auth-store"
import type { AuthFormAction } from "@/lib/auth/form-state"
import type { LoginField } from "@/lib/auth/validation"

function readText(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

/**
 * Signs in with the submitted credentials. Redirecting to the dashboard is
 * left to `RedirectIfAuthenticated`, which reacts to the session changing.
 */
export const loginAction: AuthFormAction<LoginField> = async (
  _state,
  formData
) => {
  try {
    await signIn(
      readText(formData, "email").trim(),
      readText(formData, "password")
    )
    return { status: "success" }
  } catch (error) {
    return { status: "error", message: describeApiError(error) }
  }
}
