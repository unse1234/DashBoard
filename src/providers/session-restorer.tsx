"use client"

import { useEffect } from "react"

import { restoreSession } from "@/lib/auth/auth-store"

/**
 * Renders nothing; restores the session from the refresh cookie on page load.
 *
 * Mounted by the layouts of the route groups that read the session, `(auth)`
 * and `(dashboard)`, never by the root layout: the storefront is public, and a
 * restore there would send every shopper's page load a refresh the API can
 * only refuse. Mount it beside a session guard, not inside one: the guard
 * waits for the restore to settle before it renders its children.
 */
export function SessionRestorer() {
  useEffect(() => {
    void restoreSession()
  }, [])

  return null
}
