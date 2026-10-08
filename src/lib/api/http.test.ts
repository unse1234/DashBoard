import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { apiRequest } from "@/lib/api/http"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function lastRequest() {
  const [url, init] = fetchMock.mock.calls[0]
  return {
    url: String(url),
    init: init ?? {},
    headers: init?.headers as Record<string, string>,
  }
}

describe("apiRequest", () => {
  it("sends a JSON body without cookies by default and parses the response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "ok" }))

    const result = await apiRequest<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: { email: "ada@example.com" },
      }
    )

    expect(result).toEqual({ message: "ok" })
    const { url, init, headers } = lastRequest()
    expect(url).toBe("http://localhost:3001/auth/forgot-password")
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("omit")
    expect(init.cache).toBe("no-store")
    expect(init.body).toBe('{"email":"ada@example.com"}')
    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers).not.toHaveProperty("Authorization")
    expect(headers).not.toHaveProperty("X-CSRF-Protection")
  })

  it("includes cookies and the CSRF header for cookie endpoints", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiRequest("/auth/refresh", { method: "POST", withCookies: true })

    const { init, headers } = lastRequest()
    expect(init.credentials).toBe("include")
    expect(headers["X-CSRF-Protection"]).toBe("1")
    expect(headers).not.toHaveProperty("Content-Type")
  })

  it("sends the access token as a bearer credential", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiRequest("/users", { accessToken: "token-123" })

    expect(lastRequest().headers.Authorization).toBe("Bearer token-123")
  })

  it("resolves undefined for 204 responses", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(
      apiRequest("/auth/logout", { method: "POST" })
    ).resolves.toBeUndefined()
  })

  it("rejects with the API's message and status", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 401,
          error: "Unauthorized",
          message: "Invalid email or password",
        },
        401
      )
    )

    const error = await apiRequest("/auth/login").catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 401,
      message: "Invalid email or password",
      messages: ["Invalid email or password"],
    })
  })

  it("keeps every message of a validation error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          message: ["email must be an email", "password too short"],
        },
        400
      )
    )

    const error = (await apiRequest("/users").catch(
      (e: unknown) => e
    )) as ApiError

    expect(error.messages).toEqual([
      "email must be an email",
      "password too short",
    ])
    expect(error.message).toBe("email must be an email")
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad gateway</html>", { status: 502 })
    )

    const error = (await apiRequest("/users").catch(
      (e: unknown) => e
    )) as ApiError

    expect(error.status).toBe(502)
    expect(error.message).toBe("Something went wrong. Please try again.")
  })

  it("reports an unreachable server as a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    const error = (await apiRequest("/users").catch(
      (e: unknown) => e
    )) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNetworkError).toBe(true)
    expect(error.message).toMatch(/unable to reach the server/i)
  })

  it("lets aborted requests propagate unchanged", async () => {
    const abort = new DOMException("aborted", "AbortError")
    fetchMock.mockRejectedValue(abort)

    await expect(apiRequest("/users")).rejects.toBe(abort)
  })
})
