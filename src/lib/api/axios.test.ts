import { CanceledError, isCancel } from "axios"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { apiClient, attachSessionHandlers } from "@/lib/api/axios"
import { mockApi, networkError } from "@/test-utils/mock-api"

const getAccessToken = vi.fn<() => Promise<string>>()
const refreshSession = vi.fn<() => Promise<boolean>>()
const clearSession = vi.fn<() => void>()

let api: ReturnType<typeof mockApi>

beforeEach(() => {
  vi.resetAllMocks()
  getAccessToken.mockResolvedValue("token-1")
  attachSessionHandlers({ getAccessToken, refreshSession, clearSession })
})

afterEach(() => {
  api.restore()
})

function respondWith(...replies: Parameters<typeof mockApi>[0][]) {
  api = mockApi((request, index) =>
    replies[Math.min(index, replies.length - 1)](request, index)
  )
  return api
}

const ok =
  (data: unknown = {}) =>
  () => ({ data })
const failWith = (status: number, message: string) => () => ({
  status,
  data: { statusCode: status, message },
})

describe("apiClient requests", () => {
  it("targets the configured API and sends JSON without cookies by default", async () => {
    respondWith(ok({ message: "ok" }))

    const { data } = await apiClient.post(
      "/auth/forgot-password",
      { email: "ada@example.com" },
      { skipAuth: true }
    )

    expect(data).toEqual({ message: "ok" })
    expect(apiClient.defaults.baseURL).toBe("http://localhost:3001")
    const [request] = api.requests
    expect(request).toMatchObject({
      method: "POST",
      url: "/auth/forgot-password",
      body: { email: "ada@example.com" },
      withCredentials: false,
    })
    expect(request.headers["content-type"]).toBe("application/json")
    expect(request.headers).not.toHaveProperty("authorization")
  })

  it("attaches the in-memory access token to authenticated requests", async () => {
    respondWith(ok({ data: [] }))

    await apiClient.get("/users", { params: { page: 2 } })

    expect(api.requests[0].headers.authorization).toBe("Bearer token-1")
    expect(api.requests[0].params).toEqual({ page: 2 })
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it("never attaches a token to public endpoints", async () => {
    respondWith(ok())

    await apiClient.post("/auth/login", {}, { skipAuth: true })

    expect(getAccessToken).not.toHaveBeenCalled()
    expect(api.requests[0].headers).not.toHaveProperty("authorization")
  })

  it("resolves an empty body for 204 responses", async () => {
    respondWith(() => ({ status: 204 }))

    const { data, status } = await apiClient.delete("/users/1")

    expect(status).toBe(204)
    expect(data).toBe("")
  })

  it("passes the cancellation signal on, and lets cancellations through untouched", async () => {
    const controller = new AbortController()
    respondWith(() => new CanceledError("canceled"))

    const error = await apiClient
      .get("/users", { signal: controller.signal })
      .catch((e: unknown) => e)

    expect(api.requests[0].signal).toBe(controller.signal)
    expect(isCancel(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
    expect(refreshSession).not.toHaveBeenCalled()
  })
})

describe("apiClient errors", () => {
  it("rejects with the API's message and status", async () => {
    respondWith(failWith(401, "Invalid email or password"))

    const error = await apiClient
      .post("/auth/login", {}, { skipAuth: true })
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 401,
      message: "Invalid email or password",
      messages: ["Invalid email or password"],
    })
  })

  it("keeps every message of a validation error", async () => {
    respondWith(() => ({
      status: 400,
      data: {
        statusCode: 400,
        message: ["email must be an email", "password too short"],
      },
    }))

    const error = (await apiClient
      .post("/users", {})
      .catch((e: unknown) => e)) as ApiError

    expect(error.messages).toEqual([
      "email must be an email",
      "password too short",
    ])
    expect(error.message).toBe("email must be an email")
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    respondWith(() => ({ status: 502, data: "<html>Bad gateway</html>" }))

    const error = (await apiClient
      .get("/users")
      .catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(502)
    expect(error.message).toBe("Something went wrong. Please try again.")
  })

  it("reports an unreachable server as a network error without ending the session", async () => {
    respondWith(() => networkError())

    const error = (await apiClient
      .get("/users")
      .catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNetworkError).toBe(true)
    expect(error.message).toMatch(/unable to reach the server/i)
    expect(refreshSession).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })

  it.each([400, 403, 404, 409, 429, 500])(
    "passes a %i through without refreshing or signing out",
    async (status) => {
      respondWith(failWith(status, "nope"))

      await expect(apiClient.get("/users")).rejects.toMatchObject({ status })

      expect(api.requests).toHaveLength(1)
      expect(refreshSession).not.toHaveBeenCalled()
      expect(clearSession).not.toHaveBeenCalled()
    }
  )
})

describe("apiClient session refresh", () => {
  it("refreshes once and replays the request with the renewed token after a 401", async () => {
    getAccessToken
      .mockResolvedValueOnce("stale-token")
      .mockResolvedValueOnce("fresh-token")
    refreshSession.mockResolvedValue(true)
    respondWith(failWith(401, "Invalid or expired token"), ok({ id: "1" }))

    const { data } = await apiClient.patch("/users/1", { name: "Ada" })

    expect(data).toEqual({ id: "1" })
    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(api.requests.map((r) => r.headers.authorization)).toEqual([
      "Bearer stale-token",
      "Bearer fresh-token",
    ])
    // The replay is the same request, body included, not a re-encoded copy.
    expect(api.requests[1]).toMatchObject({
      method: "PATCH",
      url: "/users/1",
      body: { name: "Ada" },
    })
    expect(clearSession).not.toHaveBeenCalled()
  })

  it("replays at most once: a second 401 is final and cannot loop", async () => {
    refreshSession.mockResolvedValue(true)
    respondWith(failWith(401, "Invalid or expired token"))

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 401,
    })

    expect(api.requests).toHaveLength(2)
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it("clears the session and rejects when the refresh is refused", async () => {
    refreshSession.mockResolvedValue(false)
    respondWith(failWith(401, "Invalid or expired token"))

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 401,
      message: "Invalid or expired token",
    })

    expect(clearSession).toHaveBeenCalledTimes(1)
    expect(api.requests).toHaveLength(1)
  })

  it("does not sign the user out when the refresh fails for a network reason", async () => {
    refreshSession.mockRejectedValue(
      new ApiError(0, ["Unable to reach the server."])
    )
    respondWith(failWith(401, "Invalid or expired token"))

    await expect(apiClient.get("/users")).rejects.toMatchObject({ status: 0 })

    expect(clearSession).not.toHaveBeenCalled()
  })

  it("does not answer a wrong password or a refused refresh token with a refresh", async () => {
    respondWith(failWith(401, "Invalid email or password"))

    await expect(
      apiClient.post("/auth/login", {}, { skipAuth: true })
    ).rejects.toMatchObject({ status: 401 })

    expect(refreshSession).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
    expect(api.requests).toHaveLength(1)
  })

  it("propagates the expired-session error raised while obtaining a token, sending nothing", async () => {
    getAccessToken.mockRejectedValue(
      new ApiError(401, ["Your session has expired. Please log in again."])
    )
    respondWith(ok())

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 401,
      message: "Your session has expired. Please log in again.",
    })

    expect(api.requests).toHaveLength(0)
    // The session is already unrecoverable; do not try to refresh it again.
    expect(refreshSession).not.toHaveBeenCalled()
  })
})
