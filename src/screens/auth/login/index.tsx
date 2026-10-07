import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { routes } from "@/lib/routes"
import { LoginForm } from "@/screens/auth/login/components/login-form"

export function LoginScreen() {
  return (
    <AuthShell
      title="Log in"
      description="Enter your email and password to access your account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <AuthLink href={routes.register}>Create an account</AuthLink>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
