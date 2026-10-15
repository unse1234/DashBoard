import type { QueryClient, QueryFilters } from "@tanstack/react-query"

import { getAuthState, subscribeToAuth } from "@/lib/auth/auth-store"

function currentIdentity() {
  return getAuthState().user?.id ?? null
}

/**
 * Keeps private server data from outliving the person it was fetched for.
 * Public storefront queries live under ["storefront"] and do not depend on
 * the staff session: cancelling them can strand a mounted shop on its skeleton.
 *
 * It listens to the store directly (not through a component) so private data is
 * removed before React renders the new identity. Refreshing a token or editing
 * the profile keeps the same account, so those leave the cache alone.
 *
 * Returns the function that stops listening.
 */
export function clearCacheOnAccountChange(queryClient: QueryClient) {
  let identity = currentIdentity()
  const privateQueries: QueryFilters = {
    predicate: ({ queryKey }) => queryKey[0] !== "storefront",
  }

  return subscribeToAuth(() => {
    const next = currentIdentity()
    if (next === identity) return
    identity = next

    // Abort and forget the previous account's reads. Leave public queries and
    // their observers intact so a response can still reach the storefront.
    void queryClient.cancelQueries(privateQueries)
    queryClient.removeQueries(privateQueries)
    queryClient.getMutationCache().clear()
  })
}
