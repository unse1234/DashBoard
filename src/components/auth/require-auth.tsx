"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { routes } from "@/lib/routes"

type RequireAuthProps = {
  children: ReactNode
}

/**
 * Gate for the dashboard. It shows nothing but a loading state until the
 * session is known, then either renders the app or redirects: to the login
 * screen without a session, or to email verification while the address is
 * unverified (the API refuses unverified users everything else).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status, user } = useAuth()
  const router = useRouter()

  const redirectTo =
    status === "unauthenticated"
      ? routes.login
      : user && !user.emailVerifiedAt
        ? routes.verifyEmail
        : null

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo)
  }, [redirectTo, router])

  if (status !== "authenticated" || redirectTo) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Spinner className="size-6" aria-label="Loading your account" />
      </div>
    )
  }

  return children
}
