import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useApiResource } from "@/hooks/use-api-resource"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("useApiResource", () => {
  it("loads, then exposes the data", async () => {
    const load = vi.fn().mockResolvedValue("first")
    const { result } = renderHook(() => useApiResource("a", load))

    expect(result.current).toMatchObject({ data: undefined, isLoading: true })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBe("first")
    expect(result.current.error).toBeUndefined()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it("refetches when the key changes, keeping the old data meanwhile", async () => {
    const second = deferred<string>()
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce("first")
      .mockReturnValueOnce(second.promise)
    const { result, rerender } = renderHook(
      ({ id }) => useApiResource(id, load),
      { initialProps: { id: "a" } }
    )
    await waitFor(() => expect(result.current.data).toBe("first"))

    rerender({ id: "b" })

    expect(result.current).toMatchObject({ data: "first", isLoading: true })
    await act(async () => second.resolve("second"))
    expect(result.current).toMatchObject({ data: "second", isLoading: false })
  })

  it("ignores a slow response that was superseded", async () => {
    const slow = deferred<string>()
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce("fast")
    const { result, rerender } = renderHook(
      ({ id }) => useApiResource(id, load),
      { initialProps: { id: "a" } }
    )

    rerender({ id: "b" })
    await waitFor(() => expect(result.current.data).toBe("fast"))
    await act(async () => slow.resolve("stale"))

    expect(result.current.data).toBe("fast")
    expect(load.mock.calls[0][0].aborted).toBe(true)
  })

  it("reports a failure for the current request and recovers on reload", async () => {
    const failure = new Error("nope")
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("ok")
    const { result } = renderHook(() => useApiResource("a", load))

    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(result.current.isLoading).toBe(false)

    act(() => result.current.reload())
    expect(result.current).toMatchObject({ isLoading: true, error: undefined })
    await waitFor(() => expect(result.current.data).toBe("ok"))
    expect(result.current.error).toBeUndefined()
  })

  it("keeps earlier data when a later request fails", async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce("first")
      .mockRejectedValueOnce(new Error("later failure"))
    const { result } = renderHook(() => useApiResource("a", load))
    await waitFor(() => expect(result.current.data).toBe("first"))

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
    expect(result.current.data).toBe("first")
  })

  it("aborts the request when unmounted", async () => {
    const pending = deferred<string>()
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockReturnValue(pending.promise)
    const { unmount } = renderHook(() => useApiResource("a", load))

    unmount()

    expect(load.mock.calls[0][0].aborted).toBe(true)
  })
})
