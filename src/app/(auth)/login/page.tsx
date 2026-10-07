import type { Metadata } from "next"

import { LoginScreen } from "@/screens/auth/login"

export const metadata: Metadata = {
  title: "Log in",
}

export default function LoginPage() {
  return <LoginScreen />
}
