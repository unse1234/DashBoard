import type { QueryClient } from "@tanstack/react-query"

import { getAuthState, subscribeToAuth } from "@/lib/auth/auth-store"

function currentIdentity() {
  return getAuthState().user?.id ?? null
}

/**
 * Keeps cached server data from outliving the person it was fetched for: the
 * whole cache is dropped whenever the signed-in account changes, including
 * signing out and being signed out by an expired session.
 *
 * It listens to the store directly (not through a component) so the cache is
 * empty before React renders anything for the new identity. Refreshing a token
 * or editing the profile keeps the same account, so those leave the cache alone.
 *
 * Returns the function that stops listening.
 */
export function clearCacheOnAccountChange(queryClient: QueryClient) {
  let identity = currentIdentity()

  return subscribeToAuth(() => {
    const next = currentIdentity()
    if (next === identity) return
    identity = next

    // Abort requests still running for the previous account, then forget
    // everything it fetched, so a late response cannot repopulate the cache.
    void queryClient.cancelQueries()
    queryClient.clear()
  })
}
