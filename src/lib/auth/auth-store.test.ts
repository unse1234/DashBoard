import { vi } from "vitest"

import type { AuthResponse, AuthUser } from "@/lib/auth/auth.types"

vi.mock("@/lib/auth/auth.api")

const user: AuthUser = {
  id: "user-1",
  name: "Ada Admin",
  email: "ada@example.com",
  role: "ADMIN",
  emailVerifiedAt: "2026-01-01T00:00:00Z",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

function authResponse(accessToken = "token-1", expiresIn = 900): AuthResponse {
  return { accessToken, tokenType: "Bearer", expiresIn, user }
}

// The store keeps module-level state, so every test gets a fresh copy. Errors
// must come from that same copy: `instanceof ApiError` compares class identity.
async function loadModules() {
  vi.resetModules()
  const { ApiError } = await import("@/lib/api/api-error")
  const store = await import("@/lib/auth/auth-store")
  const api = await import("@/lib/auth/auth.api")
  return {
    store,
    api: vi.mocked(api),
    unauthorized: () => new ApiError(401, ["Invalid refresh token"]),
    unreachable: () => new ApiError(0, ["Unable to reach the server."]),
    wrongPassword: () => new ApiError(401, ["Invalid email or password"]),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("auth store", () => {
  it("starts in the loading state", async () => {
    const { store } = await loadModules()

    expect(store.getAuthState()).toEqual({ status: "loading", user: null })
    expect(store.getServerAuthState()).toEqual({
      status: "loading",
      user: null,
    })
  })

  it("signs in, notifies subscribers and serves the token without refreshing", async () => {
    const { store, api } = await loadModules()
    api.login.mockResolvedValue(authResponse("fresh-token"))
    const listener = vi.fn()
    store.subscribeToAuth(listener)

    await store.signIn("ada@example.com", "secret")

    expect(api.login).toHaveBeenCalledWith("ada@example.com", "secret")
    expect(store.getAuthState()).toEqual({ status: "authenticated", user })
    expect(listener).toHaveBeenCalled()
    await expect(store.getAccessToken()).resolves.toBe("fresh-token")
    expect(api.refresh).not.toHaveBeenCalled()
  })

  it("leaves the state unchanged when sign-in fails", async () => {
    const { store, api, wrongPassword } = await loadModules()
    api.login.mockRejectedValue(wrongPassword())

    await expect(
      store.signIn("ada@example.com", "wrong")
    ).rejects.toMatchObject({
      status: 401,
    })

    expect(store.getAuthState().status).toBe("loading")
  })

  it("shares one refresh call between concurrent callers", async () => {
    const { store, api } = await loadModules()
    api.refresh.mockResolvedValue(authResponse())

    const results = await Promise.all([
      store.refreshSession(),
      store.refreshSession(),
      store.refreshSession(),
    ])

    expect(results).toEqual([true, true, true])
    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it("retries once when a concurrent tab won the refresh race", async () => {
    const { store, api, unauthorized } = await loadModules()
    api.refresh
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce(authResponse("second-try"))

    const pending = store.refreshSession()
    await vi.advanceTimersByTimeAsync(300)

    await expect(pending).resolves.toBe(true)
    expect(api.refresh).toHaveBeenCalledTimes(2)
    await expect(store.getAccessToken()).resolves.toBe("second-try")
  })

  it("gives up after the retry is also rejected", async () => {
    const { store, api, unauthorized } = await loadModules()
    api.refresh.mockRejectedValue(unauthorized())

    const pending = store.refreshSession()
    await vi.advanceTimersByTimeAsync(300)

    await expect(pending).resolves.toBe(false)
    expect(api.refresh).toHaveBeenCalledTimes(2)
  })

  it("does not retry other failures", async () => {
    const { store, api, unreachable } = await loadModules()
    api.refresh.mockRejectedValue(unreachable())

    await expect(store.refreshSession()).rejects.toMatchObject({ status: 0 })
    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it("allows a new refresh after the previous one settles", async () => {
    const { store, api } = await loadModules()
    api.refresh.mockResolvedValue(authResponse())

    await store.refreshSession()
    await store.refreshSession()

    expect(api.refresh).toHaveBeenCalledTimes(2)
  })

  describe("restoreSession", () => {
    it("authenticates from the refresh cookie", async () => {
      const { store, api } = await loadModules()
      api.refresh.mockResolvedValue(authResponse())

      await store.restoreSession()

      expect(store.getAuthState()).toEqual({ status: "authenticated", user })
    })

    it("ends unauthenticated when there is no valid cookie", async () => {
      const { store, api, unauthorized } = await loadModules()
      api.refresh.mockRejectedValue(unauthorized())

      const pending = store.restoreSession()
      await vi.advanceTimersByTimeAsync(300)
      await pending

      expect(store.getAuthState()).toEqual({
        status: "unauthenticated",
        user: null,
      })
    })

    it("ends unauthenticated when the server is unreachable", async () => {
      const { store, api, unreachable } = await loadModules()
      api.refresh.mockRejectedValue(unreachable())

      await store.restoreSession()

      expect(store.getAuthState().status).toBe("unauthenticated")
    })

    it("runs only once, however often it is called", async () => {
      const { store, api } = await loadModules()
      api.refresh.mockResolvedValue(authResponse())

      await Promise.all([store.restoreSession(), store.restoreSession()])
      await store.restoreSession()

      expect(api.refresh).toHaveBeenCalledTimes(1)
    })
  })

  describe("getAccessToken", () => {
    it("renews a token that is about to expire", async () => {
      const { store, api } = await loadModules()
      api.login.mockResolvedValue(authResponse("old-token", 60))
      api.refresh.mockResolvedValue(authResponse("new-token", 900))
      await store.signIn("ada@example.com", "secret")

      // 31 s later only 29 s remain, inside the 30 s renewal margin.
      vi.advanceTimersByTime(31_000)

      await expect(store.getAccessToken()).resolves.toBe("new-token")
      expect(api.refresh).toHaveBeenCalledTimes(1)
    })

    it("clears the session and rejects when it cannot be renewed", async () => {
      const { store, api, unauthorized } = await loadModules()
      api.refresh.mockRejectedValue(unauthorized())

      const pending = store.getAccessToken().catch((e: unknown) => e)
      await vi.advanceTimersByTimeAsync(300)

      expect(await pending).toMatchObject({ status: 401 })
      expect(store.getAuthState()).toEqual({
        status: "unauthenticated",
        user: null,
      })
    })
  })

  describe("signOut", () => {
    it("clears the session and ends it on the server", async () => {
      const { store, api } = await loadModules()
      api.login.mockResolvedValue(authResponse())
      api.logout.mockResolvedValue(undefined)
      await store.signIn("ada@example.com", "secret")

      await store.signOut()

      expect(api.logout).toHaveBeenCalledTimes(1)
      expect(store.getAuthState()).toEqual({
        status: "unauthenticated",
        user: null,
      })
    })

    it("still signs out locally, then reports a failed server call", async () => {
      const { store, api, unreachable } = await loadModules()
      api.login.mockResolvedValue(authResponse())
      api.logout.mockRejectedValue(unreachable())
      await store.signIn("ada@example.com", "secret")

      await expect(store.signOut()).rejects.toMatchObject({ status: 0 })

      expect(store.getAuthState().status).toBe("unauthenticated")
    })
  })
})
