import type { Metadata } from "next"

import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Log in",
}

export default function LoginPage() {
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
