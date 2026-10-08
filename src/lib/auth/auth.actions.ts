import { describeApiError, isApiError } from "@/lib/api/api-error"
import { forgotPassword, resetPassword } from "@/lib/auth/auth.api"
import { signIn } from "@/lib/auth/auth-store"
import type { AuthFormAction } from "@/lib/auth/form-state"
import type {
  ForgotPasswordField,
  LoginField,
  ResetPasswordField,
} from "@/lib/auth/validation"

/** What the API answers for reset tokens that are unknown, used or expired. */
const INVALID_TOKEN_MESSAGE = "Invalid or expired token"

export const INVALID_RESET_LINK_MESSAGE =
  "This reset link is invalid or has expired. Request a new one."

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

/** The API answers the same whether or not the address has an account. */
export const forgotPasswordAction: AuthFormAction<ForgotPasswordField> = async (
  _state,
  formData
) => {
  try {
    const { message } = await forgotPassword(readText(formData, "email").trim())
    return { status: "success", message }
  } catch (error) {
    return { status: "error", message: describeApiError(error) }
  }
}

/** Binds the token from the emailed link; also used to accept an invitation. */
export function createResetPasswordAction(
  token: string
): AuthFormAction<ResetPasswordField> {
  return async (_state, formData) => {
    try {
      const { message } = await resetPassword(
        token,
        readText(formData, "password")
      )
      return { status: "success", message }
    } catch (error) {
      const invalidLink =
        isApiError(error) &&
        error.status === 400 &&
        error.message === INVALID_TOKEN_MESSAGE
      return {
        status: "error",
        message: invalidLink
          ? INVALID_RESET_LINK_MESSAGE
          : describeApiError(error),
      }
    }
  }
}
