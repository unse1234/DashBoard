import { vi } from "vitest"

import { apiClient } from "@/lib/api/axios"
import type { AuthResponse } from "@/types/auth.types"
import {
  getAuthState,
  resetAuthStore,
  restoreSession,
  signIn,
} from "@/lib/auth/auth-store"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  mockApi,
  networkError,
  type MockReply,
  type RecordedRequest,
} from "@/test-utils/mock-api"

// These tests use the real auth store and the real API client together; only the
// network is faked. They cover what neither can show alone: how a burst of
// requests with a dying token turns into one refresh.

function authResponse(accessToken: string, expiresIn = 900): AuthResponse {
  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn,
    user: createAuthUser(),
  }
}

const bearerOf = (request: RecordedRequest) => request.headers.authorization
const refreshCalls = (api: ReturnType<typeof mockApi>) =>
  api.requests.filter((request) => request.url === "/auth/refresh")
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let api: ReturnType<typeof mockApi>

beforeEach(() => {
  resetAuthStore()
})

afterEach(() => {
  api.restore()
  vi.useRealTimers()
})

describe("session refresh through the API client", () => {
  it("restores a session from the refresh cookie and uses its token afterwards", async () => {
    api = mockApi((request) =>
      request.url === "/auth/refresh"
        ? { data: authResponse("restored-token") }
        : { data: { data: [] } }
    )

    await restoreSession()
    await apiClient.get("/users")

    expect(getAuthState()).toMatchObject({ status: "authenticated" })
    expect(refreshCalls(api)).toHaveLength(1)
    expect(refreshCalls(api)[0].withCredentials).toBe(true)
    expect(bearerOf(api.requests[1])).toBe("Bearer restored-token")
  })

  it("answers many parallel 401s with one refresh, then replays every request once with the new token", async () => {
    api = mockApi(async (request) => {
      if (request.url === "/auth/login") return { data: authResponse("old") }
      if (request.url === "/auth/refresh") {
        await delay(10)
        return { data: authResponse("rotated") }
      }
      return bearerOf(request) === "Bearer rotated"
        ? { data: { ok: true } }
        : { status: 401, data: { message: "Invalid or expired token" } }
    })
    await signIn("ada@example.com", "secret")

    const results = await Promise.all(
      ["/users", "/users/1", "/users/2", "/users/3"].map((url) =>
        apiClient.get(url)
      )
    )

    expect(results.map((r) => r.data)).toEqual(Array(4).fill({ ok: true }))
    expect(refreshCalls(api)).toHaveLength(1)
    const protectedCalls = api.requests.filter(
      (r) => !r.url.startsWith("/auth/")
    )
    expect(protectedCalls).toHaveLength(8) // 4 rejected + 4 replays, none twice
    expect(
      protectedCalls.filter((r) => bearerOf(r) === "Bearer rotated")
    ).toHaveLength(4)
  })

  it("renews a token that is about to expire before sending, so nothing is rejected", async () => {
    api = mockApi((request) => {
      if (request.url === "/auth/login")
        return { data: authResponse("old", 20) }
      if (request.url === "/auth/refresh") {
        return { data: authResponse("fresh") }
      }
      return { data: { ok: true } }
    })
    await signIn("ada@example.com", "secret")

    // 20 s of life left is inside the 30 s renewal margin.
    await apiClient.get("/users")

    expect(refreshCalls(api)).toHaveLength(1)
    const [protectedCall] = api.requests.filter(
      (r) => !r.url.startsWith("/auth/")
    )
    expect(bearerOf(protectedCall)).toBe("Bearer fresh")
  })

  it("ends the session when the refresh cookie is no longer accepted, without looping", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] })
    api = mockApi((request): MockReply => {
      if (request.url === "/auth/login") return { data: authResponse("old") }
      return { status: 401, data: { message: "Invalid or expired token" } }
    })
    await signIn("ada@example.com", "secret")

    const outcome = apiClient.get("/users").catch((error: unknown) => error)
    // The store retries a rejected refresh once, after a short pause.
    await vi.advanceTimersByTimeAsync(300)

    expect(await outcome).toMatchObject({ status: 401 })
    expect(getAuthState()).toEqual({ status: "unauthenticated", user: null })
    expect(refreshCalls(api)).toHaveLength(2)
    // The protected request itself went out once; it was never replayed.
    expect(api.requests.filter((r) => r.url === "/users")).toHaveLength(1)
  })

  it("keeps the session when the refresh fails only because the server is unreachable", async () => {
    api = mockApi((request) => {
      if (request.url === "/auth/login") return { data: authResponse("old") }
      if (request.url === "/auth/refresh") return networkError()
      return { status: 401, data: { message: "Invalid or expired token" } }
    })
    await signIn("ada@example.com", "secret")

    await expect(apiClient.get("/users")).rejects.toMatchObject({ status: 0 })

    expect(getAuthState().status).toBe("authenticated")
  })

  it("never refreshes because of a wrong password", async () => {
    api = mockApi(() => ({
      status: 401,
      data: { message: "Invalid email or password" },
    }))

    await expect(signIn("ada@example.com", "wrong")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    })

    expect(api.requests).toHaveLength(1)
    expect(getAuthState().status).toBe("loading")
  })

  it("stops after one replay even if the API keeps answering 401", async () => {
    api = mockApi((request) => {
      if (request.url === "/auth/login") return { data: authResponse("old") }
      if (request.url === "/auth/refresh") {
        return { data: authResponse("rotated") }
      }
      return { status: 401, data: { message: "Invalid or expired token" } }
    })
    await signIn("ada@example.com", "secret")

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 401,
    })

    expect(refreshCalls(api)).toHaveLength(1)
    expect(api.requests.filter((r) => r.url === "/users")).toHaveLength(2)
    // The session is still valid; only this request was refused.
    expect(getAuthState().status).toBe("authenticated")
  })
})
