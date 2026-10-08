import type { Metadata } from "next"

import { VerifyEmailScreen } from "@/screens/auth/verify-email"

export const metadata: Metadata = {
  title: "Verify email",
  // The link carries a secret token; keep it out of the Referer header.
  referrer: "no-referrer",
}

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const { token } = await searchParams

  return (
    <VerifyEmailScreen token={typeof token === "string" ? token : undefined} />
  )
}
