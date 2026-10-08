import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/screens/auth/login/components/login-form"

export function LoginScreen() {
  return (
    <AuthShell
      title="Log in"
      description="Enter your email and password to access your account."
      footer="Accounts are created by an administrator. Ask for an invitation if you need access."
    >
      <LoginForm />
    </AuthShell>
  )
}
