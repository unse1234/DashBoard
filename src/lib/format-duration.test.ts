import { formatDuration } from "@/lib/format-duration"

describe("formatDuration", () => {
  it("shows seconds below a minute", () => {
    expect(formatDuration(0)).toBe("0s")
    expect(formatDuration(45)).toBe("45s")
  })

  it("shows minutes, and seconds when there are some", () => {
    expect(formatDuration(240)).toBe("4m")
    expect(formatDuration(252)).toBe("4m 12s")
  })

  it("shows hours and minutes from an hour up", () => {
    expect(formatDuration(3600)).toBe("1h")
    expect(formatDuration(3900)).toBe("1h 5m")
  })

  it("never goes negative", () => {
    expect(formatDuration(-5)).toBe("0s")
  })
})
