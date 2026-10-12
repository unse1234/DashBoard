import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { shouldRetryQuery } from "@/lib/query/query-client"
import { getUser, listUsers } from "@/lib/users/user.api"
import type { UserPage } from "@/types/user.types";
import { useUserQuery, useUsersQuery } from "@/lib/users/user.queries"
import { defaultUsersQuery } from "@/lib/users/user.query"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createQueryWrapper } from "@/test-utils/render"
import { createUser } from "@/test-utils/user-fixtures"

vi.mock("@/lib/users/user.api")
vi.mock("@/hooks/use-auth")

const ada = createUser({ uid: "u-ada", name: "Ada" })

function page(...names: string[]): UserPage {
  return {
    users: names.map((name) => createUser({ uid: name, name })),
    totalRecords: 30,
  }
}

function signedIn() {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  signedIn()
})

describe("useUsersQuery", () => {
  it("loads the requested page with the request's abort signal", async () => {
    vi.mocked(listUsers).mockResolvedValue(page("Ada"))

    const { result } = renderHook(() => useUsersQuery(defaultUsersQuery), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalRecords).toBe(30)
    expect(listUsers).toHaveBeenCalledWith(
      defaultUsersQuery,
      expect.any(AbortSignal)
    )
  })

  it.each(["loading", "unauthenticated"] as const)(
    "stays idle while the session is %s",
    async (status) => {
      vi.mocked(useAuth).mockReturnValue({ status, user: null })

      const { result } = renderHook(() => useUsersQuery(defaultUsersQuery), {
        wrapper: createQueryWrapper(),
      })

      expect(result.current.fetchStatus).toBe("idle")
      expect(listUsers).not.toHaveBeenCalled()
    }
  )

  it("starts loading as soon as the session becomes authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })
    vi.mocked(listUsers).mockResolvedValue(page("Ada"))
    const { result, rerender } = renderHook(
      () => useUsersQuery(defaultUsersQuery),
      { wrapper: createQueryWrapper() }
    )
    expect(listUsers).not.toHaveBeenCalled()

    signedIn()
    rerender()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listUsers).toHaveBeenCalledTimes(1)
  })

  it("keeps showing the previous page while the next one loads", async () => {
    let resolveSecond: (value: UserPage) => void = () => {}
    vi.mocked(listUsers)
      .mockResolvedValueOnce(page("First"))
      .mockReturnValueOnce(new Promise((resolve) => (resolveSecond = resolve)))
    const { result, rerender } = renderHook(
      ({ pageNumber }) =>
        useUsersQuery({ ...defaultUsersQuery, page: pageNumber }),
      { wrapper: createQueryWrapper(), initialProps: { pageNumber: 1 } }
    )
    await waitFor(() =>
      expect(result.current.data?.users[0].name).toBe("First")
    )

    rerender({ pageNumber: 2 })

    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.users[0].name).toBe("First")
    resolveSecond(page("Second"))
    await waitFor(() =>
      expect(result.current.data?.users[0].name).toBe("Second")
    )
    expect(result.current.isPlaceholderData).toBe(false)
  })

  it("treats searches that differ only by surrounding spaces as one request", async () => {
    vi.mocked(listUsers).mockResolvedValue(page("Ada"))
    const wrapper = createQueryWrapper()
    const { result, rerender } = renderHook(
      ({ search }) => useUsersQuery({ ...defaultUsersQuery, search }),
      { wrapper, initialProps: { search: "ada" } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ search: "  ada " })

    expect(listUsers).toHaveBeenCalledTimes(1)
    expect(vi.mocked(listUsers).mock.calls[0][0].search).toBe("ada")
  })

  it("serves repeated visits to the same page from the cache while it is fresh", async () => {
    vi.mocked(listUsers).mockResolvedValue(page("Ada"))
    const wrapper = createQueryWrapper()

    const first = renderHook(() => useUsersQuery(defaultUsersQuery), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()
    const second = renderHook(() => useUsersQuery(defaultUsersQuery), {
      wrapper,
    })

    expect(second.result.current.data?.users[0].name).toBe("Ada")
    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})

describe("useUserQuery", () => {
  it("loads one user by id", async () => {
    vi.mocked(getUser).mockResolvedValue(ada)

    const { result } = renderHook(() => useUserQuery("u-ada"), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toEqual(ada))
    expect(getUser).toHaveBeenCalledWith("u-ada", expect.any(AbortSignal))
  })

  it("keeps each user's data apart", async () => {
    vi.mocked(getUser).mockResolvedValue(ada)
    const { result, rerender } = renderHook(({ uid }) => useUserQuery(uid), {
      wrapper: createQueryWrapper(),
      initialProps: { uid: "u-ada" },
    })
    await waitFor(() => expect(result.current.data).toEqual(ada))

    rerender({ uid: "u-other" })

    // No leftover from the previous user while the next one loads.
    expect(result.current.data).toBeUndefined()
  })

  it("stays idle until the session is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    const { result } = renderHook(() => useUserQuery("u-ada"), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(getUser).not.toHaveBeenCalled()
  })
})

describe("retry policy as applied to these queries", () => {
  function clientWithAppRetryPolicy() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: shouldRetryQuery, retryDelay: 1 },
      },
    })
  }

  it.each([401, 403, 404])(
    "asks only once when the API answers %i",
    async (status) => {
      vi.mocked(getUser).mockRejectedValue(new ApiError(status, ["no"]))

      const { result } = renderHook(() => useUserQuery("u-ada"), {
        wrapper: createQueryWrapper(clientWithAppRetryPolicy()),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(getUser).toHaveBeenCalledTimes(1)
    }
  )

  it("tries a failing server a few times before giving up", async () => {
    vi.mocked(getUser).mockRejectedValue(new ApiError(503, ["down"]))

    const { result } = renderHook(() => useUserQuery("u-ada"), {
      wrapper: createQueryWrapper(clientWithAppRetryPolicy()),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getUser).toHaveBeenCalledTimes(3)
  })
})
