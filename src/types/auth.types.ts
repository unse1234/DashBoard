export type UserRole = "ADMIN" | "STAFF"

/** The account fields the API exposes; it never returns credentials. */
export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  /** ISO 8601, or null until the address is verified. */
  emailVerifiedAt: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

/** Response of `POST /auth/login` and `POST /auth/refresh`. */
export type AuthResponse = {
  accessToken: string
  tokenType: "Bearer"
  /** Access token lifetime in seconds. */
  expiresIn: number
  user: AuthUser
}

export type MessageResponse = {
  message: string
}

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

// The session itself (token, status, refresh) stays in the auth store. These
// hooks give the screens React Query's pending and error handling around the
// calls that change it. Cached server data is dropped by `clearCacheOnAccountChange`
// when the signed-in account changes, so no mutation here has to clean up.

export type LoginCredentials = {
  email: string
  password: string
}

export type ResetPasswordRequest = {
  token: string
  password: string
}

/**
 * What the client needs from the session. The auth store registers itself here
 * (see `attachSessionHandlers`) instead of being imported, because the store
 * calls the auth API through this very client.
 */
export type SessionHandlers = {
  /** A valid access token, renewing it first when it is missing or about to expire. */
  getAccessToken: () => Promise<string>
  /**
   * Exchanges the refresh cookie for a new access token. Concurrent callers must
   * share one network call. Resolves `false` when there is no valid session.
   */
  refreshSession: () => Promise<boolean>
  /** Forgets the session after it could not be renewed. */
  clearSession: () => void
}
