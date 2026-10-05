import type { Metadata } from "next"

import { AuthLink } from "@/components/auth/auth-link"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Create account",
}

export default function RegisterPage() {
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
