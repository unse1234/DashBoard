"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { LoadError } from "@/components/shared/load-error"
import { useAuth } from "@/hooks/auth/use-auth"
import { restoreSession } from "@/lib/auth/auth-store"
import { routes } from "@/config/routes"

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
  const { status, user, error } = useAuth()
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

  if (status === "error") {
    return (
      <div className="mx-auto flex w-full max-w-lg items-center p-6">
        <LoadError
          resourceName="your account"
          error={error}
          onRetry={() => void restoreSession()}
        />
      </div>
    )
  }

  if (status !== "authenticated" || redirectTo) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Spinner className="size-6" aria-label="Loading your account" />
      </div>
    )
  }

  return children
}
