import { useMutation } from "@tanstack/react-query"

import * as authApi from "@/lib/auth/auth.api"
import {
  getAuthState,
  refreshSession,
  restoreSession,
  signIn,
  signOut,
} from "@/lib/auth/auth-store"

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

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      signIn(email, password),
  })
}

/** Signs out on this device first, then ends the session on the server (see `signOut`). */
export function useLogoutMutation() {
  return useMutation({ mutationFn: () => signOut() })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, password }: ResetPasswordRequest) =>
      authApi.resetPassword(token, password),
  })
}

export function useResendVerificationMutation() {
  return useMutation({ mutationFn: () => authApi.resendVerification() })
}

/**
 * A signed-in user's session still says "unverified" after the address is
 * verified; reload it so the dashboard guard lets them through. Visitors
 * without a session have nothing to reload.
 */
async function reloadSessionAfterVerification() {
  await restoreSession()
  if (getAuthState().status === "authenticated") {
    await refreshSession().catch(() => false)
  }
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      await authApi.verifyEmail(token)
      await reloadSessionAfterVerification()
    },
  })
}
