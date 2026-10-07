import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { routes } from "@/lib/routes"
import { ForgotPasswordForm } from "@/screens/auth/forgot-password/components/forgot-password-form"

export function ForgotPasswordScreen() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter the email address associated with your account and we'll send you a link to reset your password."
      footer={
        <>
          Remember your password?{" "}
          <AuthLink href={routes.login}>Log in</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
