import { describeApiError, isApiError } from "@/lib/api/api-error"
import type {
  LoginCredentials,
  ResetPasswordRequest,
} from "@/lib/auth/auth.mutations"
import type { MessageResponse } from "@/lib/auth/auth.types"
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

// Each action turns a submitted form into a call to the matching mutation
// (the `mutateAsync` of the hooks in `auth.mutations`) and the outcome into
// form state. Keeping them free of React makes them easy to test.

/**
 * Signs in with the submitted credentials. Redirecting to the dashboard is
 * left to `RedirectIfAuthenticated`, which reacts to the session changing.
 */
export function createLoginAction(
  login: (credentials: LoginCredentials) => Promise<unknown>
): AuthFormAction<LoginField> {
  return async (_state, formData) => {
    try {
      await login({
        email: readText(formData, "email").trim(),
        password: readText(formData, "password"),
      })
      return { status: "success" }
    } catch (error) {
      return { status: "error", message: describeApiError(error) }
    }
  }
}

/** The API answers the same whether or not the address has an account. */
export function createForgotPasswordAction(
  requestLink: (email: string) => Promise<MessageResponse>
): AuthFormAction<ForgotPasswordField> {
  return async (_state, formData) => {
    try {
      const { message } = await requestLink(readText(formData, "email").trim())
      return { status: "success", message }
    } catch (error) {
      return { status: "error", message: describeApiError(error) }
    }
  }
}

/** Binds the token from the emailed link; also used to accept an invitation. */
export function createResetPasswordAction(
  resetPassword: (request: ResetPasswordRequest) => Promise<MessageResponse>,
  token: string
): AuthFormAction<ResetPasswordField> {
  return async (_state, formData) => {
    try {
      const { message } = await resetPassword({
        token,
        password: readText(formData, "password"),
      })
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
