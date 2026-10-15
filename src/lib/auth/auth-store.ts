import type { AuthState, AuthResponse, AuthUser } from "@/types/auth.types"
import { attachSessionHandlers, refreshSession } from "@/lib/api/axios"
import * as authApi from "@/services/auth/auth.api"

/**
 * The access token lives only in this module's memory, never in localStorage
 * or a readable cookie. Page loads restore it using the HttpOnly refresh cookie.
 *
 * The store only holds the session. Renewing it is the API client's job: it
 * refreshes when a request is rejected and tells this module the outcome.
 */

const SERVER_STATE: AuthState = { status: "loading", user: null }

let state: AuthState = SERVER_STATE
let accessToken: string | null = null
let restoreInFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

function setState(next: AuthState) {
  state = next
  listeners.forEach((listener) => listener())
}

function startSession({ accessToken: value, user }: AuthResponse) {
  accessToken = value
  setState({ status: "authenticated", user })
}

export function clearSession() {
  accessToken = null
  setState({ status: "unauthenticated", user: null })
}

/**
 * Applies a change to the signed-in user's own account (e.g. a new name) so
 * the rest of the app shows it without waiting for the next token refresh.
 * Ignored unless it is the current user.
 */
export function updateSessionUser(user: AuthUser) {
  if (state.status !== "authenticated" || state.user?.id !== user.id) return
  setState({ status: "authenticated", user })
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

/**
 * Exchanges the refresh cookie for a new access token; the API client shares
 * one call between concurrent callers. Resolves `false` when there is no valid
 * session and rejects on network or server failures.
 */
export { refreshSession }

/** Restores once per page load; temporary failures can be retried without signing out. */
export function restoreSession() {
  if (restoreInFlight) return restoreInFlight
  if (state.status !== "loading" && state.status !== "error") {
    return Promise.resolve()
  }

  setState(SERVER_STATE)
  restoreInFlight = refreshSession()
    .then((restored) => {
      if (!restored) clearSession()
    })
    .catch((error: unknown) => {
      // A timeout or outage says nothing about whether the cookie is valid.
      // Keep a retryable state instead of redirecting the user to sign in again.
      if (state.status === "loading") {
        setState({ status: "error", user: null, error })
      }
    })
    .finally(() => {
      restoreInFlight = null
    })
  return restoreInFlight
}

/** The current access token, or null without a session. It is never renewed here. */
export function getAccessToken() {
  return accessToken
}

// The API client attaches the token to authenticated requests and, on a 401,
// renews the session through these. They are registered here rather than
// imported by the client because this module calls the auth API through it.
attachSessionHandlers({
  getAccessToken,
  requestRefresh: () => authApi.refresh(),
  updateSession: startSession,
  clearSession,
})

/** Test helper: forgets everything, as if the page had just loaded. */
export function resetAuthStore() {
  state = SERVER_STATE
  accessToken = null
  restoreInFlight = null
}
