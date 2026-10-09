import type { AxiosRequestConfig } from "axios"

import { apiClient } from "@/lib/api/axios"
import type { AuthResponse, MessageResponse } from "@/lib/auth/auth.types"

/** Browsers only send this header cross-origin after a CORS preflight; the API requires it on cookie endpoints. */
const CSRF_HEADER = "X-CSRF-Protection"

/** Endpoints that read or set the HttpOnly refresh cookie. They run before a token exists, hence no bearer token. */
const cookieEndpoint = {
  skipAuth: true,
  withCredentials: true,
  headers: { [CSRF_HEADER]: "1" },
} satisfies AxiosRequestConfig

const publicEndpoint = { skipAuth: true } satisfies AxiosRequestConfig

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/login",
    { email, password },
    cookieEndpoint
  )
  return data
}

/** Exchanges the HttpOnly refresh cookie for a new access token. */
export async function refresh() {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/refresh",
    undefined,
    cookieEndpoint
  )
  return data
}

export async function logout() {
  await apiClient.post("/auth/logout", undefined, cookieEndpoint)
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/forgot-password",
    { email },
    publicEndpoint
  )
  return data
}

/** Also completes an invitation: invited users choose their password here. */
export async function resetPassword(token: string, password: string) {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/reset-password",
    { token, password },
    publicEndpoint
  )
  return data
}

export async function verifyEmail(token: string) {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/verify-email",
    { token },
    publicEndpoint
  )
  return data
}

// The call below needs a signed-in user; the client attaches the token.

export async function resendVerification() {
  const { data } = await apiClient.post<MessageResponse>(
    "/auth/resend-verification"
  )
  return data
}
