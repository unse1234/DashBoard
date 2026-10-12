import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { attachSessionHandlers } from "@/lib/api/axios"
import {
  forgotPassword,
  login,
  logout,
  refresh,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "@/services/auth/auth.api"
import { mockApi } from "@/test-utils/mock-api"

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

function serverReplies(reply: Parameters<typeof mockApi>[0]) {
  api = mockApi(reply)
}

describe("cookie endpoints", () => {
  it("login sends the credentials with the refresh cookie and the CSRF header, but no token", async () => {
    serverReplies(() => ({ data: { accessToken: "a" } }))

    await expect(login("ada@example.com", "secret")).resolves.toEqual({
      accessToken: "a",
    })

    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/auth/login",
      body: { email: "ada@example.com", password: "secret" },
      withCredentials: true,
    })
    expect(api.requests[0].headers["x-csrf-protection"]).toBe("1")
    expect(api.requests[0].headers).not.toHaveProperty("authorization")
  })

  it("refresh and logout send the cookie and CSRF header with no body", async () => {
    serverReplies(() => ({ data: { accessToken: "a" } }))

    await refresh()
    await logout()

    for (const request of api.requests) {
      expect(request.method).toBe("POST")
      expect(request.withCredentials).toBe(true)
      expect(request.headers["x-csrf-protection"]).toBe("1")
      expect(request.headers).not.toHaveProperty("authorization")
      expect(request.headers).not.toHaveProperty("content-type")
      expect(request.body).toBeUndefined()
    }
    expect(api.requests.map((r) => r.url)).toEqual([
      "/auth/refresh",
      "/auth/logout",
    ])
  })

  it("logout resolves with nothing for the 204 response", async () => {
    serverReplies(() => ({ status: 204 }))

    await expect(logout()).resolves.toBeUndefined()
  })

  it("a wrong password is a plain error, never an expired session", async () => {
    serverReplies(() => ({
      status: 401,
      data: { statusCode: 401, message: "Invalid email or password" },
    }))

    const error = await login("ada@example.com", "wrong").catch(
      (e: unknown) => e
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 401,
      message: "Invalid email or password",
    })
    expect(refreshSession).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
    expect(api.requests).toHaveLength(1)
  })

  it("a rejected refresh token is final: it does not trigger another refresh", async () => {
    serverReplies(() => ({
      status: 401,
      data: { statusCode: 401, message: "Invalid refresh token" },
    }))

    await expect(refresh()).rejects.toMatchObject({ status: 401 })

    expect(refreshSession).not.toHaveBeenCalled()
    expect(api.requests).toHaveLength(1)
  })
})

describe("public endpoints", () => {
  it.each([
    [
      "forgotPassword",
      () => forgotPassword("ada@example.com"),
      "/auth/forgot-password",
      { email: "ada@example.com" },
    ],
    [
      "resetPassword",
      () => resetPassword("tok", "New-Passw0rd-1"),
      "/auth/reset-password",
      { token: "tok", password: "New-Passw0rd-1" },
    ],
    [
      "verifyEmail",
      () => verifyEmail("tok"),
      "/auth/verify-email",
      { token: "tok" },
    ],
  ])(
    "%s posts its JSON with no cookie, CSRF header or token",
    async (_name, call, url, body) => {
      serverReplies(() => ({ data: { message: "ok" } }))

      await expect(call()).resolves.toEqual({ message: "ok" })

      expect(api.requests[0]).toMatchObject({
        method: "POST",
        url,
        body,
        withCredentials: false,
      })
      expect(api.requests[0].headers).not.toHaveProperty("x-csrf-protection")
      expect(api.requests[0].headers).not.toHaveProperty("authorization")
      expect(getAccessToken).not.toHaveBeenCalled()
    }
  )
})

describe("signed-in endpoints", () => {
  it("resendVerification carries the access token and no cookie", async () => {
    serverReplies(() => ({ data: { message: "sent" } }))

    await expect(resendVerification()).resolves.toEqual({ message: "sent" })

    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/auth/resend-verification",
      withCredentials: false,
    })
    expect(api.requests[0].headers.authorization).toBe("Bearer token-1")
  })
})
