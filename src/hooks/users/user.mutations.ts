import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { getAuthState, updateSessionUser } from "@/lib/auth/auth-store"
import {
  deleteUser,
  inviteUser,
  setUserActive,
  updateProfile,
  updateUser,
} from "@/services/users/user.api"
import { userKeys } from "@/hooks/users/user.keys"
import type { CreateUserValues, EditUserValues, ProfileValues, User } from "@/types/user.types"

// A user appears on every page of every filter of the list, so any change
// refetches the lists (not awaited: the screen keeps showing its rows, dimmed,
// until the fresh page arrives). The detail entry is replaced outright with
// what the API returned.

function invalidateLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
}

function cacheChangedUser(queryClient: QueryClient, user: User) {
  queryClient.setQueryData(userKeys.detail(user.uid), user)
  invalidateLists(queryClient)
  syncSessionWithUser(user)
}

/**
 * When the changed user is the signed-in one (editing yourself in the table,
 * or your own profile), the sidebar and every other reader of the session must
 * show the new details without waiting for the next token refresh.
 */
function syncSessionWithUser(user: User) {
  const { user: me } = getAuthState()
  if (me?.id !== user.uid) return

  updateSessionUser({
    ...me,
    name: user.name,
    role: user.role,
    isActive: user.status === "active",
  })
}

export function useInviteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateUserValues) => inviteUser(values),
    onSuccess: () => invalidateLists(queryClient),
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      uid,
      changes,
    }: {
      uid: string
      changes: Partial<EditUserValues>
    }) => updateUser(uid, changes),
    onSuccess: (user) => cacheChangedUser(queryClient, user),
  })
}

export function useSetUserActiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid, isActive }: { uid: string; isActive: boolean }) =>
      setUserActive(uid, isActive),
    onSuccess: (user) => cacheChangedUser(queryClient, user),
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uid: string) => deleteUser(uid),
    onSuccess: (_result, uid) => {
      // Nothing left to show for this user: a later visit must hit the API and get its 404.
      queryClient.removeQueries({ queryKey: userKeys.detail(uid) })
      invalidateLists(queryClient)
    },
  })
}

/** The signed-in user editing their own profile (`PATCH /users/me`). */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: ProfileValues) => updateProfile(values),
    onSuccess: (user) => cacheChangedUser(queryClient, user),
  })
}
