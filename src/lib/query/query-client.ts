import { isServer, QueryClient } from "@tanstack/react-query"

import { isApiError, REQUEST_TIMEOUT_CODE } from "@/lib/api/api-error"

/** Data older than this is refetched when something needs it again. */
export const QUERY_STALE_TIME_MS = 30_000

const MAX_QUERY_RETRIES = 2

/**
 * Retry only failures that may pass by themselves: an unreachable server or a
 * 5xx. A 4xx is the API's considered answer (400 invalid, 401 session, 403
 * forbidden, 404 missing, 429 rate limited), so repeating the request cannot
 * help and would only delay the error or add to a rate limit.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  // The user has already waited for a full deadline. Offer Retry immediately.
  if (isApiError(error) && error.code === REQUEST_TIMEOUT_CODE) return false
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < MAX_QUERY_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
      mutations: {
        // A mutation changes data, so repeating it on its own is never safe.
        retry: false,
        // Their variables can be passwords and reset tokens: do not keep them
        // in memory once nothing is observing the finished mutation.
        gcTime: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/**
 * One client per browser tab, so React re-suspending during the first render
 * cannot throw the cache away. On the server every request needs its own
 * client, or one visitor's data could reach another.
 */
export function getQueryClient() {
  if (isServer) return createQueryClient()
  return (browserQueryClient ??= createQueryClient())
}
