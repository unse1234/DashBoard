import { vi } from "vitest"

vi.mock("@/lib/api/http")
vi.mock("@/lib/auth/auth-store")

async function loadModules() {
  vi.resetModules()
  // Errors must come from the same module copy as the code under test.
  const { ApiError } = await import("@/lib/api/api-error")
  const { authenticatedRequest } =
    await import("@/lib/auth/authenticated-request")
  const http = vi.mocked(await import("@/lib/api/http"))
  const store = vi.mocked(await import("@/lib/auth/auth-store"))
  return { authenticatedRequest, http, store, ApiError }
}

describe("authenticatedRequest", () => {
  it("attaches the current access token", async () => {
    const { authenticatedRequest, http, store } = await loadModules()
    store.getAccessToken.mockResolvedValue("token-1")
    http.apiRequest.mockResolvedValue({ data: [] })

    await expect(
      authenticatedRequest("/users", { method: "GET" })
    ).resolves.toEqual({
      data: [],
    })

    expect(http.apiRequest).toHaveBeenCalledWith("/users", {
      method: "GET",
      accessToken: "token-1",
    })
    expect(store.refreshSession).not.toHaveBeenCalled()
  })

  it("refreshes once and retries after a 401", async () => {
    const { authenticatedRequest, http, store, ApiError } = await loadModules()
    store.getAccessToken
      .mockResolvedValueOnce("stale-token")
      .mockResolvedValueOnce("fresh-token")
    store.refreshSession.mockResolvedValue(true)
    http.apiRequest
      .mockRejectedValueOnce(new ApiError(401, ["Invalid or expired token"]))
      .mockResolvedValueOnce({ id: "1" })

    await expect(authenticatedRequest("/users/1")).resolves.toEqual({
      id: "1",
    })

    expect(http.apiRequest).toHaveBeenCalledTimes(2)
    expect(http.apiRequest).toHaveBeenLastCalledWith("/users/1", {
      accessToken: "fresh-token",
    })
  })

  it("clears the session when the refresh is rejected", async () => {
    const { authenticatedRequest, http, store, ApiError } = await loadModules()
    store.getAccessToken.mockResolvedValue("stale-token")
    store.refreshSession.mockResolvedValue(false)
    http.apiRequest.mockRejectedValue(
      new ApiError(401, ["Invalid or expired token"])
    )

    await expect(authenticatedRequest("/users")).rejects.toMatchObject({
      status: 401,
    })

    expect(store.clearSession).toHaveBeenCalledTimes(1)
    expect(http.apiRequest).toHaveBeenCalledTimes(1)
  })

  it.each([400, 403, 404, 409, 500])(
    "passes a %i straight through without refreshing",
    async (status) => {
      const { authenticatedRequest, http, store, ApiError } =
        await loadModules()
      store.getAccessToken.mockResolvedValue("token-1")
      http.apiRequest.mockRejectedValue(new ApiError(status, ["nope"]))

      await expect(authenticatedRequest("/users")).rejects.toMatchObject({
        status,
      })

      expect(store.refreshSession).not.toHaveBeenCalled()
      expect(store.clearSession).not.toHaveBeenCalled()
    }
  )

  it("passes network errors through without signing the user out", async () => {
    const { authenticatedRequest, http, store, ApiError } = await loadModules()
    store.getAccessToken.mockResolvedValue("token-1")
    http.apiRequest.mockRejectedValue(
      new ApiError(0, ["Unable to reach the server."])
    )

    await expect(authenticatedRequest("/users")).rejects.toMatchObject({
      status: 0,
    })

    expect(store.clearSession).not.toHaveBeenCalled()
  })

  it("propagates the expired-session error raised while obtaining a token", async () => {
    const { authenticatedRequest, http, store, ApiError } = await loadModules()
    store.getAccessToken.mockRejectedValue(
      new ApiError(401, ["Your session has expired."])
    )

    await expect(authenticatedRequest("/users")).rejects.toMatchObject({
      status: 401,
    })

    expect(http.apiRequest).not.toHaveBeenCalled()
    // The session is already unrecoverable; do not try to refresh it again.
    expect(store.refreshSession).not.toHaveBeenCalled()
  })
})
