"use client"

import { useEffect } from "react"

import { restoreSession } from "@/lib/auth/auth-store"

/** Renders nothing; restores the session from the refresh cookie on page load. */
export function SessionRestorer() {
  useEffect(() => {
    void restoreSession()
  }, [])

  return null
}
