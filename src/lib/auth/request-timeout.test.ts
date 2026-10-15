// @vitest-environment node

import { createServer, type Server, type ServerResponse } from "node:http"
import { isCancel } from "axios"

import { apiClient, refreshSession } from "@/lib/api/axios"
import { REQUEST_TIMEOUT_CODE } from "@/lib/api/api-error"
import {
  getAuthState,
  resetAuthStore,
  restoreSession,
  signIn,
} from "@/lib/auth/auth-store"
import { createQueryClient } from "@/lib/query/query-client"
import { createAuthUser } from "@/test-utils/auth-fixtures"

// Use the real HTTP adapter: a fake Axios adapter does not enforce timeouts.
const defaults = {
  baseURL: apiClient.defaults.baseURL,
  timeout: apiClient.defaults.timeout,
  adapter: apiClient.defaults.adapter,
}
const session = {
  accessToken: "restored-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: createAuthUser(),
}
let server: Server
let requests: string[]
let handle: (url: string, response: ServerResponse) => void

function reply(response: ServerResponse, data: unknown, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json" })
  response.end(JSON.stringify(data))
}

beforeEach(async () => {
  resetAuthStore()
  requests = []
  handle = () => {} // Accept the connection and deliberately never respond.
  server = createServer((request, response) => {
    requests.push(request.url!)
    handle(request.url!, response)
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string")
    throw new Error("Missing test port")
  apiClient.defaults.baseURL = `http://127.0.0.1:${address.port}`
  apiClient.defaults.adapter = "http"
  apiClient.defaults.timeout = 250
})

afterEach(async () => {
  Object.assign(apiClient.defaults, defaults)
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

it("releases all requests waiting on a stalled refresh, then restores on Retry", async () => {
  const restoring = restoreSession()
  const pending = ["/products", "/orders", "/customers"].map((url) =>
    apiClient.get(url).catch((error: unknown) => error)
  )
  await restoring

  expect(getAuthState()).toMatchObject({ status: "error", user: null })
  for (const result of await Promise.all(pending)) {
    expect(result).toMatchObject({ status: 0, code: REQUEST_TIMEOUT_CODE })
  }
  // Waiting requests fail with the refresh; none sends an unauthenticated request.
  expect(requests).toEqual(["/auth/refresh"])

  handle = (_url, response) => reply(response, session)
  apiClient.defaults.timeout = 2_000
  await restoreSession()
  expect(getAuthState().status).toBe("authenticated")
  expect(requests).toEqual(["/auth/refresh", "/auth/refresh"])
})

it("shows a timed-out query as an error without spending two more deadlines retrying", async () => {
  const client = createQueryClient()
  try {
    await expect(
      client.fetchQuery({
        queryKey: ["stalled"],
        queryFn: () =>
          apiClient.get("/storefront/products", { skipAuth: true }),
      })
    ).rejects.toMatchObject({ code: REQUEST_TIMEOUT_CODE })
    expect(requests).toEqual(["/storefront/products"])
    expect(client.getQueryState(["stalled"])?.status).toBe("error")
  } finally {
    client.clear()
  }
})

it.each([false, true])(
  "cancels a request waiting for refresh without cancelling other callers (expired token: %s)",
  async (expired) => {
    apiClient.defaults.timeout = 2_000
    let held: ServerResponse
    let notifyRefresh: () => void
    const refreshReached = new Promise<void>((resolve) => {
      notifyRefresh = resolve
    })
    handle = (url, response) => {
      if (url === "/auth/refresh") {
        held = response
        notifyRefresh()
      } else if (url === "/auth/login") {
        reply(response, { ...session, accessToken: "expired-token" })
      } else {
        reply(response, { message: "Expired" }, 401)
      }
    }
    if (expired) await signIn("ada@example.com", "secret")
    const controller = new AbortController()
    const restoring = expired ? undefined : restoreSession()
    const cancelled = apiClient
      .get("/products", { signal: controller.signal })
      .catch((error: unknown) => error)
    await refreshReached
    controller.abort()

    expect(isCancel(await cancelled)).toBe(true)
    const shared = expired ? refreshSession() : restoring
    reply(held!, session)
    await shared
    expect(getAuthState().status).toBe("authenticated")
    expect(requests.filter((url) => url === "/auth/refresh")).toHaveLength(1)
  }
)
