import type { Metadata } from "next"

import { RegisterScreen } from "@/screens/auth/register"

export const metadata: Metadata = {
  title: "Create account",
}

export default function RegisterPage() {
  return <RegisterScreen />
}
