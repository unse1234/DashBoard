import { isApiError } from "@/lib/api/api-error"
import { apiRequest, type ApiRequestOptions } from "@/lib/api/http"
import {
  clearSession,
  getAccessToken,
  refreshSession,
} from "@/lib/auth/auth-store"

type AuthenticatedRequestOptions = Omit<ApiRequestOptions, "accessToken">

/**
 * `apiRequest` for endpoints that need a signed-in user. It attaches the access
 * token (renewing it when stale) and, if the API still answers 401, refreshes
 * once and retries. When the session cannot be renewed it is cleared, which
 * sends the user back to the login screen.
 */
export async function authenticatedRequest<T = void>(
  path: string,
  options: AuthenticatedRequestOptions = {}
): Promise<T> {
  // Throws (after clearing the session) when no valid session can be renewed.
  const accessToken = await getAccessToken()

  try {
    return await apiRequest<T>(path, { ...options, accessToken })
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) throw error

    if (!(await refreshSession())) {
      clearSession()
      throw error
    }
    return apiRequest<T>(path, {
      ...options,
      accessToken: await getAccessToken(),
    })
  }
}
