"use client"

import { useMemo, useSyncExternalStore } from "react"

import {
  readConfirmationSnapshot,
  subscribeToOrderSession,
  toConfirmation,
} from "@/utils/storefront/order-session"

/**
 * The receipt of the order this tab placed, for the confirmation page; null
 * when there is none (nothing was placed, or the tab was closed since).
 */
export function useOrderConfirmation() {
  const stored = useSyncExternalStore(
    subscribeToOrderSession,
    readConfirmationSnapshot,
    () => null
  )
  return useMemo(() => toConfirmation(stored), [stored])
}
