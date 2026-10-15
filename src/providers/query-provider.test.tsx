import { useQuery, useQueryClient } from "@tanstack/react-query"
import { act, render, screen, waitFor } from "@testing-library/react"

import { QueryProvider } from "@/providers/query-provider"
import { resetAuthStore, signIn, signOut } from "@/lib/auth/auth-store"
import { getQueryClient } from "@/lib/query/query-client"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { mockApi } from "@/test-utils/mock-api"
import type { MockReply } from "@/test-utils/mock-api"
import { useStorefrontProductQuery } from "@/hooks/storefront/catalog.queries"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"

function CachedValue() {
  const { data } = useQuery({
    queryKey: ["private"],
    queryFn: () => "secret of the signed-in user",
    staleTime: Infinity,
  })
  return <p>{data ?? "nothing cached"}</p>
}

function CacheSize() {
  const queryClient = useQueryClient()
  return <p>cache entries: {queryClient.getQueryCache().getAll().length}</p>
}

function PublicProduct() {
  const { data } = useStorefrontProductQuery("PRD-1001")
  return <p>{data?.name ?? "Loading public product"}</p>
}

let api: ReturnType<typeof mockApi>

beforeEach(() => {
  resetAuthStore()
  getQueryClient().clear()
  api = mockApi((request) =>
    request.url === "/auth/login"
      ? {
          data: {
            accessToken: "t",
            tokenType: "Bearer",
            expiresIn: 900,
            user: createAuthUser(),
          },
        }
      : { status: 204 }
  )
})

afterEach(() => {
  api.restore()
  getQueryClient().clear()
})

describe("QueryProvider", () => {
  it("provides one shared client to everything below it", async () => {
    render(
      <QueryProvider>
        <CachedValue />
        <CacheSize />
      </QueryProvider>
    )

    expect(
      await screen.findByText("secret of the signed-in user")
    ).toBeVisible()
    expect(screen.getByText("cache entries: 1")).toBeVisible()
  })

  it("empties the cache when the signed-in account signs out", async () => {
    render(
      <QueryProvider>
        <CachedValue />
      </QueryProvider>
    )
    await act(() => signIn("ada@example.com", "pw"))
    await screen.findByText("secret of the signed-in user")

    await act(() => signOut())

    await waitFor(() =>
      expect(getQueryClient().getQueryData(["private"])).toBeUndefined()
    )
  })

  it("stops watching the session once it is unmounted", async () => {
    const { unmount } = render(
      <QueryProvider>
        <CachedValue />
      </QueryProvider>
    )
    await act(() => signIn("ada@example.com", "pw"))
    await screen.findByText("secret of the signed-in user")
    unmount()
    getQueryClient().setQueryData(["private"], "kept")

    await act(() => signOut())

    expect(getQueryClient().getQueryData(["private"])).toBe("kept")
  })

  it("renders a product response that finishes after an account is restored", async () => {
    let finish!: (reply: MockReply) => void
    const publicResponse = new Promise<MockReply>((resolve) => {
      finish = resolve
    })
    api.restore()
    api = mockApi((request) =>
      request.url.startsWith("/storefront/")
        ? publicResponse
        : {
            data: {
              accessToken: "t",
              tokenType: "Bearer",
              expiresIn: 900,
              user: createAuthUser(),
            },
          }
    )

    render(
      <QueryProvider>
        <PublicProduct />
      </QueryProvider>
    )
    await waitFor(() => expect(api.requests).toHaveLength(1))
    await act(() => signIn("ada@example.com", "pw"))
    await act(async () => {
      finish({
        data: createStorefrontProduct({
          id: "PRD-1001",
          name: "Public kettle",
        }),
      })
    })

    expect(await screen.findByText("Public kettle")).toBeVisible()
    expect(api.requests[0].signal?.aborted).toBe(false)
  })
})
