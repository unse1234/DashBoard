"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { describeApiError, isApiError } from "@/lib/api/api-error"
import { useVerifyEmailMutation } from "@/lib/auth/auth.mutations"
import { routes } from "@/lib/routes"

const INVALID_LINK_MESSAGE =
  "This verification link is invalid or has expired. Log in to request a new one."

function describeVerificationError(error: unknown) {
  // The API answers 400 for unknown, used and expired tokens alike.
  const invalidLink = isApiError(error) && error.status === 400
  return invalidLink ? INVALID_LINK_MESSAGE : describeApiError(error)
}

export function TokenVerification({ token }: { token: string }) {
  const { mutate: verify, isSuccess, error } = useVerifyEmailMutation()
  const { status: sessionStatus } = useAuth()
  // Tokens are single-use, so a repeated effect (Strict Mode) must not resubmit.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    verify(token)
  }, [token, verify])

  const continueHref =
    sessionStatus === "authenticated" ? routes.dashboard : routes.login
  const continueLabel =
    sessionStatus === "authenticated"
      ? "Continue to dashboard"
      : "Continue to log in"

  if (!isSuccess && !error) {
    return (
      <AuthShell
        title="Verifying your email"
        description="This only takes a moment."
      >
        <Spinner className="size-6" aria-label="Verifying your email" />
      </AuthShell>
    )
  }

  if (isSuccess) {
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
    <AuthShell
      title="Verification failed"
      description={describeVerificationError(error)}
    >
      <Link
        href={routes.login}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Back to log in
      </Link>
    </AuthShell>
  )
}
