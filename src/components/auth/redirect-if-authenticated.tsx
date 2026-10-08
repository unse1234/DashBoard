"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { routes } from "@/lib/routes"

/**
 * Renders nothing; sends a signed-in user on to the dashboard. This is also what
 * completes a login: signing in changes the session, and this reacts to it.
 */
export function RedirectIfAuthenticated() {
  const { status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") router.replace(routes.dashboard)
  }, [status, router])

  return null
}
