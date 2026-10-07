import type { Metadata } from "next"

import { ResetPasswordScreen } from "@/screens/auth/reset-password"

export const metadata: Metadata = {
  title: "Reset password",
}

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />
}
