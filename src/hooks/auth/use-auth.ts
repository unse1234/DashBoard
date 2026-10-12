"use client"

import { useSyncExternalStore } from "react"

import {
  getAuthState,
  getServerAuthState,
  subscribeToAuth,
} from "@/lib/auth/auth-store"

/** Current session: `status` is "loading" until the first restore attempt settles. */
export function useAuth() {
  return useSyncExternalStore(subscribeToAuth, getAuthState, getServerAuthState)
}
