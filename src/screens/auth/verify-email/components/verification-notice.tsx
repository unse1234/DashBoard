"use client"

import { useState } from "react"
import Link from "next/link"

import { AuthFormMessage } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { describeApiError } from "@/lib/api/api-error"
import { resendVerification } from "@/lib/auth/account.api"
import { signOut } from "@/lib/auth/auth-store"
import type { AuthFormState } from "@/lib/auth/form-state"
import { routes } from "@/lib/routes"

/** Shown when someone lands here without a token: they need to check their inbox. */
export function VerificationNotice() {
  const { status, user } = useAuth()
  const [feedback, setFeedback] = useState<AuthFormState<string>>({
    status: "idle",
  })
  const [pending, setPending] = useState(false)

  if (status === "loading") {
    return (
      <AuthShell title="Verify your email" description="Loading your account…">
        <Spinner className="size-6" aria-label="Loading your account" />
      </AuthShell>
    )
  }

  if (!user) {
    return (
      <AuthShell
        title="Verify your email"
        description="Open the verification link we emailed you. If you can't find it, log in to request a new one."
      >
        <Link
          href={routes.login}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Log in
        </Link>
      </AuthShell>
    )
  }

  if (user.emailVerifiedAt) {
    return (
      <AuthShell
        title="Email verified"
        description="Your email address is already verified."
      >
        <Link
          href={routes.dashboard}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Continue to dashboard
        </Link>
      </AuthShell>
    )
  }

  async function handleResend() {
    setPending(true)
    try {
      const { message } = await resendVerification()
      setFeedback({ status: "success", message })
    } catch (error) {
      setFeedback({ status: "error", message: describeApiError(error) })
    } finally {
      setPending(false)
    }
  }

  async function handleLogOut() {
    try {
      await signOut()
    } catch (error) {
      setFeedback({
        status: "error",
        message: `${describeApiError(error)} Your session may still be active.`,
      })
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      description={`We sent a verification link to ${user.email}. Open it to finish setting up your account.`}
    >
      <div className="flex flex-col gap-6">
        <AuthFormMessage status={feedback.status} message={feedback.message} />
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleResend}
            disabled={pending}
          >
            {pending ? (
              <>
                <Spinner aria-hidden="true" />
                Sending…
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleLogOut}
          >
            Log out
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
