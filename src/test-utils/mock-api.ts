import { AxiosError, type InternalAxiosRequestConfig } from "axios"

import { apiClient } from "@/lib/api/axios"

/** What a test sees of a request that reached the (fake) network. */
export type RecordedRequest = {
  method: string
  /** The path as the caller wrote it, without the base URL. */
  url: string
  params: unknown
  /** The JSON body, parsed. */
  body: unknown
  /** Header names are lower-cased. */
  headers: Record<string, string>
  withCredentials: boolean
  signal: AbortSignal | undefined
}

/** A reply, or an error to fail with (e.g. an `AxiosError` with no response for "server unreachable"). */
export type MockReply = { status?: number; data?: unknown } | Error

type MockHandler = (
  request: RecordedRequest,
  index: number
) => MockReply | Promise<MockReply>

function record(config: InternalAxiosRequestConfig): RecordedRequest {
  const headers = Object.fromEntries(
    Object.entries(config.headers.toJSON()).map(([name, value]) => [
      name.toLowerCase(),
      String(value),
    ])
  )

  // Browsers' XHR transport drops Content-Type from requests without a body
  // (axios/lib/adapters/xhr.js); this fake transport does the same.
  if (config.data === undefined) delete headers["content-type"]

  let body: unknown
  if (config.data instanceof FormData) body = config.data
  if (typeof config.data === "string" && config.data !== "") {
    body = JSON.parse(config.data)
  }

  return {
    method: (config.method ?? "get").toUpperCase(),
    url: config.url ?? "",
    params: config.params,
    body,
    headers,
    withCredentials: config.withCredentials === true,
    signal: config.signal as AbortSignal | undefined,
  }
}

/** A network failure: the request never got a response. */
export function networkError() {
  return new AxiosError("Network Error", AxiosError.ERR_NETWORK)
}

/**
 * Replaces the API client's transport with `handler` until `restore()` is
 * called. Everything above the transport (interceptors, error handling) runs
 * for real. Statuses outside 2xx reject the way a real response would.
 */
export function mockApi(handler: MockHandler) {
  const requests: RecordedRequest[] = []
  const original = apiClient.defaults.adapter

  apiClient.defaults.adapter = async (config) => {
    const request = record(config)
    requests.push(request)

    const reply = await handler(request, requests.length - 1)
    if (reply instanceof Error) throw reply

    const { status = 200, data } = reply
    const response = {
      data: data ?? "",
      status,
      statusText: String(status),
      headers: {},
      config,
    }
    if (status < 200 || status >= 300) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        status >= 500
          ? AxiosError.ERR_BAD_RESPONSE
          : AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        response
      )
    }
    return response
  }

  return {
    requests,
    restore() {
      apiClient.defaults.adapter = original
    },
  }
}
