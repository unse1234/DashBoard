import { authenticatedRequest } from "@/lib/auth/authenticated-request"
import type { MessageResponse } from "@/lib/auth/auth.types"

// Calls for the signed-in user's own account. They live apart from `auth.api`
// because the session store imports that module, and these depend on the store.

export function resendVerification() {
  return authenticatedRequest<MessageResponse>("/auth/resend-verification", {
    method: "POST",
  })
}
