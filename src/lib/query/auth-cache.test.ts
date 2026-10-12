import { QueryClient } from "@tanstack/react-query"

import type { AuthResponse } from "@/types/auth.types"
import {
  clearSession,
  refreshSession,
  resetAuthStore,
  signIn,
  signOut,
  updateSessionUser,
} from "@/lib/auth/auth-store"
import { clearCacheOnAccountChange } from "@/lib/query/auth-cache"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { mockApi } from "@/test-utils/mock-api"

const ada = createAuthUser({ id: "ada", name: "Ada Admin" })
const sam = createAuthUser({ id: "sam", name: "Sam Staff", role: "STAFF" })

function session(user: typeof ada): AuthResponse {
  return {
    accessToken: `token-${user.id}`,
    tokenType: "Bearer",
    expiresIn: 900,
    user,
  }
}

let api: ReturnType<typeof mockApi>
let queryClient: QueryClient
let stopListening: () => void

beforeEach(() => {
  resetAuthStore()
  queryClient = new QueryClient()
  api = mockApi((request) => {
    if (request.url === "/auth/login") {
      const email = (request.body as { email: string }).email
      return { data: session(email === "sam@example.com" ? sam : ada) }
    }
    if (request.url === "/auth/refresh") return { data: session(ada) }
    return { status: 204 }
  })
  stopListening = clearCacheOnAccountChange(queryClient)
})

afterEach(() => {
  stopListening()
  api.restore()
  queryClient.clear()
})

const cached = () => queryClient.getQueryData(["users", "list"])
function cacheAdasData() {
  queryClient.setQueryData(["users", "list"], { users: ["private to ada"] })
}

describe("clearCacheOnAccountChange", () => {
  it("drops everything cached for the user who signs out", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    await signOut()

    expect(cached()).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it("drops everything when the session ends because it expired", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    clearSession()

    expect(cached()).toBeUndefined()
  })

  it("never shows one account's data to the next account that signs in", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()
    await signOut()

    await signIn("sam@example.com", "pw")

    expect(cached()).toBeUndefined()
  })

  it("also drops it when another account replaces the session directly", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    await signIn("sam@example.com", "pw")

    expect(cached()).toBeUndefined()
  })

  it("keeps the cache while the same account renews its token", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    await refreshSession()

    expect(cached()).toEqual({ users: ["private to ada"] })
  })

  it("keeps the cache when the user edits their own profile", async () => {
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    updateSessionUser({ ...ada, name: "Ada King" })

    expect(cached()).toEqual({ users: ["private to ada"] })
  })

  it("aborts requests still running for the previous account", async () => {
    await signIn("ada@example.com", "pw")
    let requestSignal: AbortSignal | undefined
    const pending = queryClient
      .fetchQuery({
        queryKey: ["users", "list"],
        queryFn: ({ signal }) =>
          new Promise((resolve) => {
            requestSignal = signal
            signal.addEventListener("abort", () => resolve("late answer"))
          }),
      })
      .catch(() => undefined)

    await signOut()
    await pending

    expect(requestSignal?.aborted).toBe(true)
    expect(cached()).toBeUndefined()
  })

  it("stops clearing once it is unsubscribed", async () => {
    stopListening()
    await signIn("ada@example.com", "pw")
    cacheAdasData()

    await signOut()

    expect(cached()).toEqual({ users: ["private to ada"] })
  })
})
