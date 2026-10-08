import type { Metadata } from "next"

import { ResetPasswordScreen } from "@/screens/auth/reset-password"

export const metadata: Metadata = {
  title: "Reset password",
  // The link carries a secret token; keep it out of the Referer header.
  referrer: "no-referrer",
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams

  return (
    <ResetPasswordScreen
      token={typeof token === "string" ? token : undefined}
    />
  )
}
