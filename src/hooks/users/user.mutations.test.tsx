import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { getAuthState, updateSessionUser } from "@/lib/auth/auth-store"
import {
  deleteUser,
  inviteUser,
  listUsers,
  setUserActive,
  updateProfile,
  updateUser,
} from "@/services/users/user.api"
import { userKeys } from "@/hooks/users/user.keys"
import {
  useDeleteUserMutation,
  useInviteUserMutation,
  useSetUserActiveMutation,
  useUpdateProfileMutation,
  useUpdateUserMutation,
} from "@/hooks/users/user.mutations"
import { defaultUsersQuery } from "@/screens/users/user.filters"
import { useUsersQuery } from "@/hooks/users/user.queries"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"
import { createUser } from "@/test-utils/user-fixtures"

vi.mock("@/services/users/user.api")
vi.mock("@/lib/auth/auth-store")
vi.mock("@/hooks/auth/use-auth")

const ada = createUser({ uid: "u-ada", name: "Ada" })
const me = createAuthUser({ id: "u-me", name: "Me Myself", role: "ADMIN" })

/** A mounted users list next to a mutation, so tests can see the list refetch. */
function renderWithList<T>(useMutationUnderTest: () => T) {
  const queryClient = createTestQueryClient()
  const rendered = renderHook(
    () => ({
      list: useUsersQuery(defaultUsersQuery),
      mutation: useMutationUnderTest(),
    }),
    { wrapper: createQueryWrapper(queryClient) }
  )
  return { queryClient, ...rendered }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({ status: "authenticated", user: me })
  vi.mocked(getAuthState).mockReturnValue({ status: "authenticated", user: me })
  vi.mocked(listUsers).mockResolvedValue({ users: [ada], totalRecords: 1 })
})

async function listLoaded(result: {
  current: { list: { isSuccess: boolean } }
}) {
  await waitFor(() => expect(result.current.list.isSuccess).toBe(true))
  expect(listUsers).toHaveBeenCalledTimes(1)
}

describe("useInviteUserMutation", () => {
  it("refreshes the list after an invitation", async () => {
    vi.mocked(inviteUser).mockResolvedValue({
      user: createUser({ uid: "new" }),
      invitationSent: true,
    })
    const { result } = renderWithList(useInviteUserMutation)
    await listLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        name: "New",
        email: "new@example.com",
        role: "STAFF",
      })
    )

    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("leaves the list alone when the invitation fails", async () => {
    vi.mocked(inviteUser).mockRejectedValue(new ApiError(409, ["taken"]))
    const { result } = renderWithList(useInviteUserMutation)
    await listLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync({
          name: "New",
          email: "new@example.com",
          role: "STAFF",
        })
      ).rejects.toMatchObject({ status: 409 })
    })

    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})

describe("useUpdateUserMutation", () => {
  it("replaces the user's detail entry and refreshes the lists", async () => {
    const renamed = { ...ada, name: "Ada King" }
    vi.mocked(updateUser).mockResolvedValue(renamed)
    const { result, queryClient } = renderWithList(useUpdateUserMutation)
    await listLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        uid: "u-ada",
        changes: { name: "Ada King" },
      })
    )

    expect(updateUser).toHaveBeenCalledWith("u-ada", { name: "Ada King" })
    expect(queryClient.getQueryData(userKeys.detail("u-ada"))).toEqual(renamed)
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("updates the signed-in user's session when they edited themselves", async () => {
    vi.mocked(updateUser).mockResolvedValue(
      createUser({ uid: "u-me", name: "Me Renamed", role: "ADMIN" })
    )
    const { result } = renderWithList(useUpdateUserMutation)
    await listLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        uid: "u-me",
        changes: { name: "Me Renamed" },
      })
    )

    expect(updateSessionUser).toHaveBeenCalledWith({
      ...me,
      name: "Me Renamed",
      role: "ADMIN",
      isActive: true,
    })
  })

  it("leaves the session alone when someone else was edited", async () => {
    vi.mocked(updateUser).mockResolvedValue({ ...ada, name: "Ada King" })
    const { result } = renderWithList(useUpdateUserMutation)
    await listLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({
        uid: "u-ada",
        changes: { name: "Ada King" },
      })
    )

    expect(updateSessionUser).not.toHaveBeenCalled()
  })

  it("changes nothing when the API refuses", async () => {
    vi.mocked(updateUser).mockRejectedValue(
      new ApiError(409, ["At least one active admin is required"])
    )
    const { result, queryClient } = renderWithList(useUpdateUserMutation)
    await listLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync({
          uid: "u-ada",
          changes: { role: "STAFF" },
        })
      ).rejects.toMatchObject({ status: 409 })
    })

    expect(queryClient.getQueryData(userKeys.detail("u-ada"))).toBeUndefined()
    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})

describe("useSetUserActiveMutation", () => {
  it("uses the status endpoint and shows the result straight away", async () => {
    vi.mocked(setUserActive).mockResolvedValue({ ...ada, status: "inactive" })
    const { result, queryClient } = renderWithList(useSetUserActiveMutation)
    await listLoaded(result)

    await act(() =>
      result.current.mutation.mutateAsync({ uid: "u-ada", isActive: false })
    )

    expect(setUserActive).toHaveBeenCalledWith("u-ada", false)
    expect(queryClient.getQueryData(userKeys.detail("u-ada"))).toMatchObject({
      status: "inactive",
    })
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })
})

describe("useDeleteUserMutation", () => {
  it("forgets the user's detail entry and refreshes the lists", async () => {
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    const { result, queryClient } = renderWithList(useDeleteUserMutation)
    await listLoaded(result)
    queryClient.setQueryData(userKeys.detail("u-ada"), ada)
    queryClient.setQueryData(userKeys.detail("u-other"), createUser())

    await act(() => result.current.mutation.mutateAsync("u-ada"))

    expect(deleteUser).toHaveBeenCalledWith("u-ada")
    expect(queryClient.getQueryData(userKeys.detail("u-ada"))).toBeUndefined()
    // Only the deleted user's entry goes.
    expect(queryClient.getQueryData(userKeys.detail("u-other"))).toBeDefined()
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("keeps everything when the API refuses", async () => {
    vi.mocked(deleteUser).mockRejectedValue(new ApiError(403, ["no"]))
    const { result, queryClient } = renderWithList(useDeleteUserMutation)
    await listLoaded(result)
    queryClient.setQueryData(userKeys.detail("u-ada"), ada)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync("u-ada")
      ).rejects.toMatchObject({ status: 403 })
    })

    expect(queryClient.getQueryData(userKeys.detail("u-ada"))).toEqual(ada)
    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})

describe("useUpdateProfileMutation", () => {
  it("saves the name and applies it to the signed-in session", async () => {
    vi.mocked(updateProfile).mockResolvedValue(
      createUser({ uid: "u-me", name: "New Name", role: "ADMIN" })
    )
    const { result } = renderWithList(useUpdateProfileMutation)
    await listLoaded(result)

    await act(() => result.current.mutation.mutateAsync({ name: "New Name" }))

    expect(updateProfile).toHaveBeenCalledWith({ name: "New Name" })
    expect(updateSessionUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u-me", name: "New Name", email: me.email })
    )
    // Their own row in the list may show the old name.
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("does not touch the session when the API rejects the change", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new ApiError(400, ["bad name"]))
    const { result } = renderWithList(useUpdateProfileMutation)
    await listLoaded(result)

    await act(async () => {
      await expect(
        result.current.mutation.mutateAsync({ name: "x" })
      ).rejects.toMatchObject({ status: 400 })
    })

    expect(updateSessionUser).not.toHaveBeenCalled()
  })
})
