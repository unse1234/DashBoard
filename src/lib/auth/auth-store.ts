import { ApiError, isApiError } from "@/lib/api/api-error"
import * as authApi from "@/lib/auth/auth.api"
import type { AuthResponse, AuthUser } from "@/lib/auth/auth.types"

/**
 * Client-side session. The access token lives only in this module's memory
 * (never in localStorage or a readable cookie), so a page reload starts
 * "loading" and silently trades the HttpOnly refresh cookie for a new token.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export type AuthState = {
  status: AuthStatus
  user: AuthUser | null
}

/** Renew this long before expiry so a request never carries a dying token. */
const TOKEN_EXPIRY_SKEW_MS = 30_000

/**
 * The API answers 401 (without ending the session) when a second tab refreshes
 * at the same moment, because the cookie was rotated a moment earlier. Waiting
 * briefly and retrying once picks up the new cookie.
 */
const REFRESH_RACE_RETRY_DELAY_MS = 300

const SERVER_STATE: AuthState = { status: "loading", user: null }

let state: AuthState = SERVER_STATE
let accessToken: { value: string; expiresAt: number } | null = null
let refreshInFlight: Promise<boolean> | null = null
let restoreInFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function setState(next: AuthState) {
  state = next
  listeners.forEach((listener) => listener())
}

function startSession({ accessToken: value, expiresIn, user }: AuthResponse) {
  accessToken = { value, expiresAt: Date.now() + expiresIn * 1000 }
  setState({ status: "authenticated", user })
}

export function clearSession() {
  accessToken = null
  setState({ status: "unauthenticated", user: null })
}

// --- external store API (see `useAuth`) ---

export function subscribeToAuth(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAuthState() {
  return state
}

export function getServerAuthState() {
  return SERVER_STATE
}

// --- actions ---

export async function signIn(email: string, password: string) {
  startSession(await authApi.login(email, password))
}

/**
 * Ends the session on this device first, so the UI signs out even if the
 * server cannot be reached; that failure is then reported to the caller
 * because the refresh cookie may still be valid server-side.
 */
export async function signOut() {
  clearSession()
  await authApi.logout()
}

async function refreshOnce(): Promise<boolean> {
  for (let attempt = 0; ; attempt++) {
    try {
      startSession(await authApi.refresh())
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
 * Exchanges the refresh cookie for a new access token. Concurrent callers (for
 * example React Strict Mode's double effects, or several requests expiring at
 * once) share one network call: the API rotates the cookie on every refresh,
 * so parallel calls would otherwise trip its reuse detection.
 *
 * Resolves `false` when there is no valid session; rejects on network errors.
 */
export function refreshSession() {
  refreshInFlight ??= refreshOnce().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

/** Runs once per page load to restore a session from the refresh cookie. */
export function restoreSession() {
  restoreInFlight ??= refreshSession()
    .then((restored) => {
      if (!restored) clearSession()
    })
    .catch(() => {
      // The server is unreachable, so there is nothing to restore; the login
      // screen reports the connection problem if the user tries to sign in.
      clearSession()
    })
  return restoreInFlight
}

/** A valid access token, renewing it first when it is missing or about to expire. */
export async function getAccessToken() {
  if (
    accessToken &&
    accessToken.expiresAt - Date.now() > TOKEN_EXPIRY_SKEW_MS
  ) {
    return accessToken.value
  }

  if (!(await refreshSession()) || !accessToken) {
    clearSession()
    throw new ApiError(401, ["Your session has expired. Please log in again."])
  }
  return accessToken.value
}

/** Test helper: forgets everything, as if the page had just loaded. */
export function resetAuthStore() {
  state = SERVER_STATE
  accessToken = null
  refreshInFlight = null
  restoreInFlight = null
}
