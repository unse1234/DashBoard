import { vi } from "vitest"

import type { AuthResponse, AuthUser } from "@/types/auth.types"

vi.mock("@/services/auth/auth.api")

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

function authResponse(
  accessToken = "token-1",
  expiresIn = 900,
  account: AuthUser = user
): AuthResponse {
  return { accessToken, tokenType: "Bearer", expiresIn, user: account }
}

// The store keeps module-level state, so every test gets a fresh copy. Errors
// must come from that same copy: `instanceof ApiError` compares class identity.
async function loadModules() {
  vi.resetModules()
  const { ApiError } = await import("@/lib/api/api-error")
  const store = await import("@/lib/auth/auth-store")
  const api = await import("@/services/auth/auth.api")
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
    expect(store.getAccessToken()).toBe("fresh-token")
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

  it("renews the session through the API client and keeps the new token and user", async () => {
    const { store, api } = await loadModules()
    api.login.mockResolvedValue(authResponse("old-token"))
    api.refresh.mockResolvedValue(
      authResponse("new-token", 900, { ...user, name: "Ada King" })
    )
    await store.signIn("ada@example.com", "secret")

    await expect(store.refreshSession()).resolves.toBe(true)

    expect(store.getAccessToken()).toBe("new-token")
    expect(store.getAuthState()).toEqual({
      status: "authenticated",
      user: { ...user, name: "Ada King" },
    })
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
    it("is null without a session, and never triggers a refresh", async () => {
      const { store, api } = await loadModules()

      expect(store.getAccessToken()).toBeNull()
      expect(api.refresh).not.toHaveBeenCalled()
    })

    it("is null again once the session is cleared", async () => {
      const { store, api } = await loadModules()
      api.login.mockResolvedValue(authResponse("token-1"))
      await store.signIn("ada@example.com", "secret")

      store.clearSession()

      expect(store.getAccessToken()).toBeNull()
    })
  })

  describe("updateSessionUser", () => {
    it("applies a change to the signed-in user and notifies subscribers", async () => {
      const { store, api } = await loadModules()
      api.login.mockResolvedValue(authResponse())
      await store.signIn("ada@example.com", "secret")
      const listener = vi.fn()
      store.subscribeToAuth(listener)

      store.updateSessionUser({ ...user, name: "Ada King" })

      expect(store.getAuthState()).toEqual({
        status: "authenticated",
        user: { ...user, name: "Ada King" },
      })
      expect(listener).toHaveBeenCalledTimes(1)
      // The token is untouched: no refresh was needed to show the change.
      expect(store.getAccessToken()).toBe("token-1")
      expect(api.refresh).not.toHaveBeenCalled()
    })

    it("ignores a different account", async () => {
      const { store, api } = await loadModules()
      api.login.mockResolvedValue(authResponse())
      await store.signIn("ada@example.com", "secret")

      store.updateSessionUser({ ...user, id: "someone-else", name: "Other" })

      expect(store.getAuthState().user).toEqual(user)
    })

    it("does nothing without a session", async () => {
      const { store } = await loadModules()

      store.updateSessionUser(user)

      expect(store.getAuthState()).toEqual({ status: "loading", user: null })
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
