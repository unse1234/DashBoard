import { API_URL } from "@/lib/api/api.config"
import {
  ApiError,
  NETWORK_ERROR_STATUS,
  parseErrorMessages,
} from "@/lib/api/api-error"

/** Browsers only send this header cross-origin after a CORS preflight; the API requires it on cookie endpoints. */
const CSRF_HEADER = "X-CSRF-Protection"

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  /** Sent as `Authorization: Bearer …`. */
  accessToken?: string
  /** Endpoints that read or set the HttpOnly refresh cookie. */
  withCookies?: boolean
  signal?: AbortSignal
}

const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Check your connection and try again."

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined

  try {
    return await response.json()
  } catch {
    return undefined
  }
}

/**
 * Thin typed wrapper over `fetch` for the backend API. Resolves with the parsed
 * JSON body (or `undefined` for 204) and rejects with an `ApiError` for network
 * failures and non-2xx responses.
 */
export async function apiRequest<T = void>(
  path: string,
  {
    method = "GET",
    body,
    accessToken,
    withCookies = false,
    signal,
  }: ApiRequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (withCookies) headers[CSRF_HEADER] = "1"

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: withCookies ? "include" : "omit",
      cache: "no-store",
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }
    throw new ApiError(NETWORK_ERROR_STATUS, [NETWORK_ERROR_MESSAGE])
  }

  const data = await readBody(response)
  if (!response.ok) {
    throw new ApiError(response.status, parseErrorMessages(data))
  }
  return data as T
}
