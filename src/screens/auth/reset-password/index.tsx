import Link from "next/link"

import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { ResetPasswordForm } from "@/screens/auth/reset-password/components/reset-password-form"

type ResetPasswordScreenProps = {
  /** From the emailed link (password reset or invitation). */
  token?: string
}

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps) {
  if (!token) {
    return (
      <AuthShell
        title="Reset link not valid"
        description="This link is incomplete or incorrect. Request a new password reset link to continue."
        footer={<AuthLink href={routes.login}>Back to log in</AuthLink>}
      >
        <Link
          href={routes.forgotPassword}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Request a new link
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you don't use for other accounts."
      footer={
        <>
          <AuthLink href={routes.login}>Back to log in</AuthLink>
          {" · "}
          <AuthLink href={routes.forgotPassword}>Request a new link</AuthLink>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
