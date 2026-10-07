import type { Metadata } from "next"

import { ForgotPasswordScreen } from "@/screens/auth/forgot-password"

export const metadata: Metadata = {
  title: "Forgot password",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />
}
