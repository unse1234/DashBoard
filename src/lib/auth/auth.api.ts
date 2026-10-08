import { apiRequest } from "@/lib/api/http"
import type { AuthResponse, MessageResponse } from "@/lib/auth/auth.types"

// Calls that need no signed-in user. Authenticated calls go through
// `authenticatedRequest`, which attaches and renews the access token.

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    withCookies: true,
  })
}

/** Exchanges the HttpOnly refresh cookie for a new access token. */
export function refresh() {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    withCookies: true,
  })
}

export function logout() {
  return apiRequest("/auth/logout", { method: "POST", withCookies: true })
}

export function forgotPassword(email: string) {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  })
}

/** Also completes an invitation: invited users choose their password here. */
export function resetPassword(token: string, password: string) {
  return apiRequest<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  })
}

export function verifyEmail(token: string) {
  return apiRequest<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: { token },
  })
}
