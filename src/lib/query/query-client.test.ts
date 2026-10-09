import { ApiError } from "@/lib/api/api-error"
import {
  createQueryClient,
  getQueryClient,
  QUERY_STALE_TIME_MS,
  shouldRetryQuery,
} from "@/lib/query/query-client"

describe("shouldRetryQuery", () => {
  it.each([400, 401, 403, 404, 409, 429])(
    "never retries a %i, which is the API's final answer",
    (status) => {
      expect(shouldRetryQuery(0, new ApiError(status, ["no"]))).toBe(false)
    }
  )

  it("retries an unreachable server and server errors, a limited number of times", () => {
    for (const error of [
      new ApiError(0, ["offline"]),
      new ApiError(503, ["x"]),
    ]) {
      expect(shouldRetryQuery(0, error)).toBe(true)
      expect(shouldRetryQuery(1, error)).toBe(true)
      expect(shouldRetryQuery(2, error)).toBe(false)
    }
  })

  it("retries unexpected errors the same limited way", () => {
    expect(shouldRetryQuery(0, new TypeError("boom"))).toBe(true)
    expect(shouldRetryQuery(2, new TypeError("boom"))).toBe(false)
  })
})

describe("createQueryClient", () => {
  it("does not refetch fresh data, never retries mutations, and forgets finished ones", () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions()

    expect(queries?.staleTime).toBe(QUERY_STALE_TIME_MS)
    expect(queries?.retry).toBe(shouldRetryQuery)
    expect(mutations?.retry).toBe(false)
    // Mutation variables can hold passwords and reset tokens.
    expect(mutations?.gcTime).toBe(0)
  })
})

describe("getQueryClient", () => {
  it("returns the same client every time in the browser, so the cache survives re-renders", () => {
    expect(getQueryClient()).toBe(getQueryClient())
  })
})
