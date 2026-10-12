import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { getUser, listUsers } from "@/services/users/user.api"
import { userKeys } from "@/hooks/users/user.keys"
import type { UsersQuery } from "@/types/user.types"

// The dashboard only renders for a signed-in user, but `enabled` also keeps
// these from firing while the session is still being restored, or from
// retrying into a 401 after it has ended.

/**
 * One page of users. The previous page stays on screen while the next one
 * loads, so paging and typing in the search box never blank the table.
 */
export function useUsersQuery(query: UsersQuery) {
  const { status } = useAuth()
  // Searches that differ only by surrounding spaces are the same request.
  const request: UsersQuery = { ...query, search: query.search.trim() }

  return useQuery({
    queryKey: userKeys.list(request),
    queryFn: ({ signal }) => listUsers(request, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  })
}

export function useUserQuery(uid: string) {
  const { status } = useAuth()

  return useQuery({
    queryKey: userKeys.detail(uid),
    queryFn: ({ signal }) => getUser(uid, signal),
    enabled: status === "authenticated",
  })
}
