import type { Metadata } from "next"

import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Reset password",
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you don't use for other accounts."
      footer={<AuthLink href={routes.login}>Back to log in</AuthLink>}
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
