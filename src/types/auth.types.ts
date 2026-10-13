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
 * Session status while the in-memory auth store restores or ends a session.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export type AuthState = {
  status: AuthStatus
  user: AuthUser | null
}

export type LoginCredentials = {
  email: string
  password: string
}

export type ResetPasswordRequest = {
  token: string
  password: string
}

/**
 * Session contract registered by the auth store with the shared Axios client
 * through `attachSessionHandlers`, avoiding a client-to-store runtime import.
 */
export type SessionHandlers = {
  /** The in-memory access token, or null when there is no session. */
  getAccessToken: () => string | null
  /**
   * Asks the API to exchange the HttpOnly refresh cookie for a new access
   * token. The client decides when to call it and shares one call between
   * concurrent requests.
   */
  requestRefresh: () => Promise<AuthResponse>
  /** Stores a renewed token and user as the current session. */
  updateSession: (response: AuthResponse) => void
  /** Forgets the session after it could not be renewed. */
  clearSession: () => void
}
