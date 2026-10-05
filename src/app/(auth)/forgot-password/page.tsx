import type { Metadata } from "next"

import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Forgot password",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email address associated with your account and we'll send you a link to reset your password."
      footer={
        <>
          Remember your password? <AuthLink href={routes.login}>Log in</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
