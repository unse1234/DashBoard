import { act, renderHook } from "@testing-library/react"
import { vi } from "vitest"

import { useNow } from "@/hooks/use-now"

afterEach(() => {
  vi.useRealTimers()
})

describe("useNow", () => {
  it("starts at the current time and moves on every interval", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-12T10:00:00Z"))
    const { result } = renderHook(() => useNow(10_000))
    const first = result.current
    expect(first).toBe(Date.parse("2026-10-12T10:00:00Z"))

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current).toBe(first + 10_000)
  })

  it("stops its timer on unmount", () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useNow(1000))

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
