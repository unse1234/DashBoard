import { TokenVerification } from "@/screens/auth/verify-email/components/token-verification"
import { VerificationNotice } from "@/screens/auth/verify-email/components/verification-notice"

type VerifyEmailScreenProps = {
  /** From the link in the verification email; absent when redirected here after login. */
  token?: string
}

export function VerifyEmailScreen({ token }: VerifyEmailScreenProps) {
  return token ? <TokenVerification token={token} /> : <VerificationNotice />
}
