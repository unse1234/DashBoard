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
