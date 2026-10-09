import type { UsersQuery } from "@/lib/users/user.types"

/**
 * Every users cache entry lives under `["users"]`, from the broadest key to the
 * most specific, so a mutation can invalidate exactly what it affects:
 * `lists()` for every page of every filter, `detail(uid)` for one user.
 */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (query: UsersQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (uid: string) => [...userKeys.details(), uid] as const,
}
