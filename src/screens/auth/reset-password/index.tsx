import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { routes } from "@/lib/routes"
import { ResetPasswordForm } from "@/screens/auth/reset-password/components/reset-password-form"

export function ResetPasswordScreen() {
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
