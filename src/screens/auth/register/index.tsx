import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { routes } from "@/lib/routes"
import { RegisterForm } from "@/screens/auth/register/components/register-form"

export function RegisterScreen() {
  return (
    <AuthShell
      title="Create an account"
      description="Enter your details below to get started."
      footer={
        <>
          Already have an account?{" "}
          <AuthLink href={routes.login}>Log in</AuthLink>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
