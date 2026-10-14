import type { SessionHandlers } from "@/types/auth.types"
import axios, {
  isAxiosError,
  isCancel,
  type InternalAxiosRequestConfig,
} from "axios"

import { API_URL } from "@/lib/api/api.config"
import {
  ApiError,
  isApiError,
  NETWORK_ERROR_STATUS,
  parseErrorDetails,
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

/**
 * The API answers 401 (without ending the session) when a second tab refreshes
 * at the same moment, because the cookie was rotated a moment earlier. Waiting
 * briefly and retrying once picks up the new cookie.
 */
const REFRESH_RACE_RETRY_DELAY_MS = 300

let sessionHandlers: SessionHandlers | null = null
let refreshInFlight: Promise<boolean> | null = null

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
    parseErrorMessages(error.response.data),
    parseErrorDetails(error.response.data)
  )
}

async function refreshOnce(session: SessionHandlers): Promise<boolean> {
  for (let attempt = 0; ; attempt++) {
    try {
      session.updateSession(await session.requestRefresh())
      return true
    } catch (error) {
      const rejected = isApiError(error) && error.status === 401
      if (!rejected) throw error
      if (attempt === 1) return false
      await new Promise((resolve) =>
        setTimeout(resolve, REFRESH_RACE_RETRY_DELAY_MS)
      )
    }
  }
}

/**
 * Exchanges the HttpOnly refresh cookie for a new access token and hands it to
 * the session. Concurrent callers (several requests expiring at once, or React
 * Strict Mode's double effects) share one network call: the API rotates the
 * cookie on every refresh, so parallel calls would trip its reuse detection.
 *
 * Resolves `false` when there is no valid session; rejects on network errors
 * and server failures, which say nothing about whether the session is valid.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= refreshOnce(requireSessionHandlers()).finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

function bearerOf(config: InternalAxiosRequestConfig) {
  const value: unknown = config.headers?.get("Authorization")
  return typeof value === "string" ? value.replace(/^Bearer /, "") : null
}

/**
 * The one HTTP client for the backend API.
 *
 * - Authenticated requests carry the in-memory access token. Nothing renews it
 *   ahead of time: it is renewed when the API rejects it.
 * - A 401 answered by an authenticated request refreshes the session and
 *   replays the request once (`retriedAfterRefresh` stops a second replay).
 *   Parallel 401s share one refresh (see `refreshSession`).
 * - Only a 401 refreshes. A 403 means the user is known but not allowed, and a
 *   refresh would change nothing.
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

  const session = requireSessionHandlers()
  // Before the page's session is restored there is no token yet. Wait for the
  // restore instead of sending a request that can only be rejected.
  if (!session.getAccessToken() && refreshInFlight) {
    await refreshInFlight.catch(() => false)
  }

  const accessToken = session.getAccessToken()
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`)
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
    // A token newer than the one this request carried means another request's
    // refresh already finished; use it instead of rotating the cookie again.
    const renewedMeanwhile =
      session.getAccessToken() !== null &&
      session.getAccessToken() !== bearerOf(error.config)

    if (renewedMeanwhile || (await refreshSession())) {
      // The request interceptor attaches the renewed token on the way out.
      return apiClient.request({ ...error.config, retriedAfterRefresh: true })
    }
    session.clearSession()
  }

  throw toApiError(error)
})
