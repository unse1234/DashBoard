import { formatFileSize } from "@/lib/format-file-size"

describe("formatFileSize", () => {
  it("uses bytes below a kilobyte", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(1023)).toBe("1023 B")
  })

  it("uses kilobytes below a megabyte", () => {
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(49_459)).toBe("48.3 KB")
  })

  it("uses megabytes from a megabyte up, without a trailing .0", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB")
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB")
    expect(formatFileSize(12.4 * 1024 * 1024)).toBe("12.4 MB")
  })
})
