import type { SessionHandlers } from "@/types/auth.types"
import axios, { isAxiosError, isCancel } from "axios"

import { API_URL } from "@/lib/api/api.config"
import {
  ApiError,
  NETWORK_ERROR_STATUS,
  parseErrorMessages,
} from "@/lib/api/api-error"

declare module "axios" {
  // The type parameter must match axios' own declaration to merge with it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  export interface AxiosRequestConfig<D = any> {
    /**
     * For endpoints that need no signed-in user (login, refresh, password
     * recovery): no bearer token is attached and a 401 is not answered with a
     * session refresh. A wrong password must not look like an expired session.
     */
    skipAuth?: boolean
    /** Set on the replay of a request after a session refresh; it is never replayed twice. */
    retriedAfterRefresh?: boolean
  }
}

const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Check your connection and try again."

let sessionHandlers: SessionHandlers | null = null

export function attachSessionHandlers(handlers: SessionHandlers) {
  sessionHandlers = handlers
}

function requireSessionHandlers() {
  if (!sessionHandlers) {
    throw new Error(
      "No session is attached to the API client. Import the auth store before making authenticated requests."
    )
  }
  return sessionHandlers
}

/**
 * Turns an Axios failure into an `ApiError`, keeping every message the API
 * returned. Cancellations and errors that did not come from a request pass
 * through unchanged.
 */
export function toApiError(error: unknown): unknown {
  if (error instanceof ApiError || isCancel(error) || !isAxiosError(error)) {
    return error
  }
  if (!error.response) {
    return new ApiError(NETWORK_ERROR_STATUS, [NETWORK_ERROR_MESSAGE])
  }
  return new ApiError(
    error.response.status,
    parseErrorMessages(error.response.data)
  )
}

/**
 * The one HTTP client for the backend API.
 *
 * - Authenticated requests carry the in-memory access token, renewed before it
 *   expires (see `SessionHandlers`).
 * - A 401 answered by an authenticated request refreshes the session once and
 *   replays the request once. Parallel 401s share one refresh, because the
 *   store's refresh is single-flight and the API rotates the cookie on use.
 * - Failures reject with an `ApiError`.
 *
 * Cookies are not sent by default: only the endpoints that read or set the
 * HttpOnly refresh cookie ask for them (see `auth.api.ts`).
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
})

apiClient.interceptors.request.use(async (config) => {
  if (config.skipAuth) return config

  const accessToken = await requireSessionHandlers().getAccessToken()
  config.headers.set("Authorization", `Bearer ${accessToken}`)
  return config
})

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (
    isAxiosError(error) &&
    error.response?.status === 401 &&
    error.config &&
    !error.config.skipAuth &&
    !error.config.retriedAfterRefresh
  ) {
    const session = requireSessionHandlers()
    if (await session.refreshSession()) {
      // The request interceptor attaches the renewed token on the way out.
      return apiClient.request({ ...error.config, retriedAfterRefresh: true })
    }
    session.clearSession()
  }

  throw toApiError(error)
})
