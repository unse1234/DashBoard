import type { Metadata } from "next"

import { VerifyEmailScreen } from "@/screens/auth/verify-email"

export const metadata: Metadata = {
  title: "Verify email",
}

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { token } = await searchParams

  return (
    <VerifyEmailScreen token={typeof token === "string" ? token : undefined} />
  )
}
