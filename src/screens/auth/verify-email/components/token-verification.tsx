"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { describeApiError, isApiError } from "@/lib/api/api-error"
import { verifyEmail } from "@/lib/auth/auth.api"
import {
  getAuthState,
  refreshSession,
  restoreSession,
} from "@/lib/auth/auth-store"
import { routes } from "@/lib/routes"

type Outcome =
  | { status: "verifying" }
  | { status: "verified" }
  | { status: "failed"; message: string }

const INVALID_LINK_MESSAGE =
  "This verification link is invalid or has expired. Log in to request a new one."

async function verify(token: string): Promise<Outcome> {
  try {
    await verifyEmail(token)
  } catch (error) {
    // The API answers 400 for unknown, used and expired tokens alike.
    const invalidLink = isApiError(error) && error.status === 400
    return {
      status: "failed",
      message: invalidLink ? INVALID_LINK_MESSAGE : describeApiError(error),
    }
  }

  // A signed-in user's session still says "unverified"; reload it so the
  // dashboard guard lets them through. Visitors without a session have
  // nothing to reload.
  await restoreSession()
  if (getAuthState().status === "authenticated") {
    await refreshSession().catch(() => false)
  }
  return { status: "verified" }
}

export function TokenVerification({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<Outcome>({ status: "verifying" })
  const { status: sessionStatus } = useAuth()
  // Tokens are single-use, so a repeated effect (Strict Mode) must not resubmit.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void verify(token).then(setOutcome)
  }, [token])

  const continueHref =
    sessionStatus === "authenticated" ? routes.dashboard : routes.login
  const continueLabel =
    sessionStatus === "authenticated"
      ? "Continue to dashboard"
      : "Continue to log in"

  if (outcome.status === "verifying") {
    return (
      <AuthShell
        title="Verifying your email"
        description="This only takes a moment."
      >
        <Spinner className="size-6" aria-label="Verifying your email" />
      </AuthShell>
    )
  }

  if (outcome.status === "verified") {
    return (
      <AuthShell
        title="Email verified"
        description="Your email address has been verified."
      >
        <Link
          href={continueHref}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {continueLabel}
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Verification failed" description={outcome.message}>
      <Link
        href={routes.login}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Back to log in
      </Link>
    </AuthShell>
  )
}
