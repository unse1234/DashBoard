import { CanceledError, isCancel } from "axios"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import {
  apiClient,
  attachSessionHandlers,
  refreshSession,
} from "@/lib/api/axios"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { mockApi, networkError } from "@/test-utils/mock-api"
import type { AuthResponse } from "@/types/auth.types"

function authResponse(accessToken: string): AuthResponse {
  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 900,
    user: createAuthUser(),
  }
}

// A stand-in session: `token` is what the store would hold in memory.
let token: string | null
const getAccessToken = vi.fn<() => string | null>(() => token)
const requestRefresh = vi.fn<() => Promise<AuthResponse>>()
const updateSession = vi.fn<(response: AuthResponse) => void>()
const clearSession = vi.fn<() => void>()

let api: ReturnType<typeof mockApi>

beforeEach(() => {
  vi.resetAllMocks()
  token = "token-1"
  getAccessToken.mockImplementation(() => token)
  updateSession.mockImplementation((response) => {
    token = response.accessToken
  })
  attachSessionHandlers({
    getAccessToken,
    requestRefresh,
    updateSession,
    clearSession,
  })
})

afterEach(() => {
  api.restore()
  vi.useRealTimers()
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
    expect(requestRefresh).not.toHaveBeenCalled()
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
    expect(requestRefresh).not.toHaveBeenCalled()
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

  it("keeps a business refusal's code and its extra fields as details", async () => {
    respondWith(() => ({
      status: 409,
      data: {
        statusCode: 409,
        error: "Conflict",
        message: "There is not enough stock for this quantity",
        code: "INSUFFICIENT_STOCK",
        productId: "PRD-1004",
      },
    }))

    const error = (await apiClient
      .post("/storefront/bag/quote", {})
      .catch((e: unknown) => e)) as ApiError

    expect(error.code).toBe("INSUFFICIENT_STOCK")
    expect(error.details).toEqual({
      code: "INSUFFICIENT_STOCK",
      productId: "PRD-1004",
    })
    expect(error.message).toBe("There is not enough stock for this quantity")
  })

  it("has no code and no details for an error that carries only a message", async () => {
    respondWith(() => ({
      status: 404,
      data: { statusCode: 404, error: "Not Found", message: "Order not found" },
    }))

    const error = (await apiClient
      .get("/orders/ORD-1")
      .catch((e: unknown) => e)) as ApiError

    expect(error.code).toBeNull()
    expect(error.details).toEqual({})
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    respondWith(() => ({ status: 502, data: "<html>Bad gateway</html>" }))

    const error = (await apiClient
      .get("/users")
      .catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(502)
    expect(error.message).toBe("Something went wrong. Please try again.")
  })

  it("reads a JSON error body that arrived as text, as a CSV download's does", async () => {
    respondWith(() => ({
      status: 410,
      data: JSON.stringify({
        statusCode: 410,
        message: "The error report has expired.",
      }),
    }))

    const error = (await apiClient
      .get("/imports/IMP-1/errors", { responseType: "text" })
      .catch((e: unknown) => e)) as ApiError

    expect(error).toMatchObject({
      status: 410,
      message: "The error report has expired.",
    })
  })

  it.each([
    ["an HTML page", "<html>Bad gateway</html>"],
    ["broken JSON", '{"message": "cut off'],
    ["a JSON array", '["message"]'],
    ["an oversized body", `{"message": "${"x".repeat(20_000)}"}`],
  ])("does not trust %s that arrives as text", async (_label, body) => {
    respondWith(() => ({ status: 500, data: body }))

    const error = (await apiClient
      .get("/imports/IMP-1/errors", { responseType: "text" })
      .catch((e: unknown) => e)) as ApiError

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
    expect(requestRefresh).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })

  it.each([400, 403, 404, 409, 429, 500])(
    "passes a %i through without refreshing or signing out",
    async (status) => {
      respondWith(failWith(status, "nope"))

      await expect(apiClient.get("/users")).rejects.toMatchObject({ status })

      expect(api.requests).toHaveLength(1)
      expect(requestRefresh).not.toHaveBeenCalled()
      expect(clearSession).not.toHaveBeenCalled()
    }
  )
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const bearer = (token: string) => `Bearer ${token}`
const expired = () => ({
  status: 401,
  data: { statusCode: 401, message: "Invalid or expired token" },
})

describe("apiClient session refresh", () => {
  it("refreshes once and replays the request with the renewed token after a 401", async () => {
    requestRefresh.mockResolvedValue(authResponse("token-2"))
    api = mockApi((request) =>
      request.headers.authorization === bearer("token-2")
        ? { data: { id: "1" } }
        : expired()
    )

    const { data } = await apiClient.patch("/users/1", { name: "Ada" })

    expect(data).toEqual({ id: "1" })
    expect(requestRefresh).toHaveBeenCalledTimes(1)
    expect(updateSession).toHaveBeenCalledWith(authResponse("token-2"))
    expect(api.requests.map((r) => r.headers.authorization)).toEqual([
      bearer("token-1"),
      bearer("token-2"),
    ])
    // The replay is the same request, body included, not a re-encoded copy.
    expect(api.requests[1]).toMatchObject({
      method: "PATCH",
      url: "/users/1",
      body: { name: "Ada" },
    })
    expect(clearSession).not.toHaveBeenCalled()
  })

  it("answers parallel 401s with one refresh and replays each request once", async () => {
    requestRefresh.mockImplementation(async () => {
      await delay(10)
      return authResponse("token-2")
    })
    api = mockApi((request) =>
      request.headers.authorization === bearer("token-2")
        ? { data: { ok: true } }
        : expired()
    )

    const results = await Promise.all(
      ["/users", "/users/1", "/users/2"].map((url) => apiClient.get(url))
    )

    expect(results.map((r) => r.data)).toEqual(Array(3).fill({ ok: true }))
    expect(requestRefresh).toHaveBeenCalledTimes(1)
    expect(api.requests).toHaveLength(6) // 3 rejected + 3 replays
  })

  it("replays a request that was rejected after another request's refresh finished, without refreshing again", async () => {
    requestRefresh.mockResolvedValue(authResponse("token-2"))
    api = mockApi(async (request) => {
      const renewed = request.headers.authorization === bearer("token-2")
      if (request.url === "/slow" && !renewed) await delay(30)
      return renewed ? { data: { ok: true } } : expired()
    })

    const [fast, slow] = await Promise.all([
      apiClient.get("/fast"),
      apiClient.get("/slow"),
    ])

    expect([fast.data, slow.data]).toEqual([{ ok: true }, { ok: true }])
    expect(requestRefresh).toHaveBeenCalledTimes(1)
  })

  it("replays at most once: a second 401 is final and cannot loop", async () => {
    requestRefresh.mockResolvedValue(authResponse("token-2"))
    api = mockApi(() => expired())

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 401,
    })

    expect(api.requests).toHaveLength(2)
    expect(requestRefresh).toHaveBeenCalledTimes(1)
    // The session itself is still good; only this request was refused.
    expect(clearSession).not.toHaveBeenCalled()
  })

  it("never refreshes after a 403", async () => {
    api = mockApi(() => ({
      status: 403,
      data: { statusCode: 403, message: "Insufficient permissions" },
    }))

    await expect(apiClient.get("/users")).rejects.toMatchObject({
      status: 403,
    })

    expect(api.requests).toHaveLength(1)
    expect(requestRefresh).not.toHaveBeenCalled()
  })

  it.each(["/auth/login", "/auth/refresh", "/auth/forgot-password"])(
    "does not answer a 401 from %s with a refresh",
    async (url) => {
      respondWith(failWith(401, "Invalid email or password"))

      await expect(
        apiClient.post(url, {}, { skipAuth: true })
      ).rejects.toMatchObject({ status: 401 })

      expect(requestRefresh).not.toHaveBeenCalled()
      expect(clearSession).not.toHaveBeenCalled()
      expect(api.requests).toHaveLength(1)
    }
  )

  it("clears the session and rejects with the original 401 when the refresh is refused", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] })
    requestRefresh.mockRejectedValue(
      new ApiError(401, ["Invalid refresh token"])
    )
    respondWith(failWith(401, "Invalid or expired token"))

    const outcome = apiClient.get("/users").catch((e: unknown) => e)
    // A refused refresh is retried once, after a short pause (see below).
    await vi.advanceTimersByTimeAsync(300)

    expect(await outcome).toMatchObject({
      status: 401,
      message: "Invalid or expired token",
    })
    expect(requestRefresh).toHaveBeenCalledTimes(2)
    expect(clearSession).toHaveBeenCalledTimes(1)
    expect(api.requests).toHaveLength(1)
  })

  it("retries a refused refresh once, in case another tab just rotated the cookie", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] })
    requestRefresh
      .mockRejectedValueOnce(new ApiError(401, ["Invalid refresh token"]))
      .mockResolvedValueOnce(authResponse("token-2"))
    api = mockApi((request) =>
      request.headers.authorization === bearer("token-2")
        ? { data: { ok: true } }
        : expired()
    )

    const outcome = apiClient.get("/users")
    await vi.advanceTimersByTimeAsync(300)

    await expect(outcome).resolves.toMatchObject({ data: { ok: true } })
    expect(requestRefresh).toHaveBeenCalledTimes(2)
    expect(clearSession).not.toHaveBeenCalled()
  })

  it.each([
    ["the server is unreachable", new ApiError(0, ["Unable to reach."])],
    ["the server fails", new ApiError(503, ["Service unavailable."])],
  ])(
    "keeps the session when the refresh fails because %s",
    async (_label, failure) => {
      requestRefresh.mockRejectedValue(failure)
      respondWith(failWith(401, "Invalid or expired token"))

      await expect(apiClient.get("/users")).rejects.toBe(failure)

      expect(requestRefresh).toHaveBeenCalledTimes(1)
      expect(clearSession).not.toHaveBeenCalled()
    }
  )

  it("refreshes a request that carried no token, then replays it with the new one", async () => {
    token = null
    requestRefresh.mockResolvedValue(authResponse("token-2"))
    api = mockApi((request) =>
      request.headers.authorization === bearer("token-2")
        ? { data: { ok: true } }
        : expired()
    )

    await apiClient.get("/users")

    expect(api.requests[0].headers).not.toHaveProperty("authorization")
    expect(api.requests[1].headers.authorization).toBe(bearer("token-2"))
  })

  it("holds a request without a token until the refresh already running finishes", async () => {
    token = null
    requestRefresh.mockImplementation(async () => {
      await delay(10)
      return authResponse("token-2")
    })
    respondWith(ok({ ok: true }))

    const restoring = refreshSession()
    await apiClient.get("/users")
    await restoring

    // Nothing was sent bare and rejected: one request, with the restored token.
    expect(api.requests).toHaveLength(1)
    expect(api.requests[0].headers.authorization).toBe(bearer("token-2"))
    expect(requestRefresh).toHaveBeenCalledTimes(1)
  })
})

describe("refreshSession", () => {
  it("shares one call between concurrent callers", async () => {
    requestRefresh.mockResolvedValue(authResponse("token-2"))

    const results = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ])

    expect(results).toEqual([true, true, true])
    expect(requestRefresh).toHaveBeenCalledTimes(1)
    expect(updateSession).toHaveBeenCalledTimes(1)
  })

  it("allows a new refresh once the previous one has settled", async () => {
    requestRefresh.mockResolvedValue(authResponse("token-2"))

    await refreshSession()
    await refreshSession()

    expect(requestRefresh).toHaveBeenCalledTimes(2)
  })

  it("does not retry a failure that is not a refused cookie", async () => {
    requestRefresh.mockRejectedValue(new ApiError(0, ["Unable to reach."]))

    await expect(refreshSession()).rejects.toMatchObject({ status: 0 })

    expect(requestRefresh).toHaveBeenCalledTimes(1)
  })
})
