import {
  getRecordRange,
  getTotalPages,
  getVisiblePages,
} from "@/lib/pagination"

describe("getTotalPages", () => {
  it("rounds up and never returns less than one page", () => {
    expect(getTotalPages(248, 10)).toBe(25)
    expect(getTotalPages(250, 50)).toBe(5)
    expect(getTotalPages(0, 10)).toBe(1)
  })
})

describe("getRecordRange", () => {
  it("describes the records shown on a page", () => {
    expect(getRecordRange(1, 10, 248)).toEqual({ from: 1, to: 10 })
    expect(getRecordRange(25, 10, 248)).toEqual({ from: 241, to: 248 })
    expect(getRecordRange(1, 10, 0)).toEqual({ from: 0, to: 0 })
  })
})

describe("getVisiblePages", () => {
  it("lists every page when they all fit", () => {
    expect(getVisiblePages(1, 1)).toEqual([1])
    expect(getVisiblePages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("collapses the end when near the first page", () => {
    expect(getVisiblePages(1, 25)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 25])
    expect(getVisiblePages(4, 25)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 25])
  })

  it("collapses both sides in the middle", () => {
    expect(getVisiblePages(13, 25)).toEqual([
      1,
      "ellipsis-start",
      12,
      13,
      14,
      "ellipsis-end",
      25,
    ])
  })

  it("collapses the start when near the last page", () => {
    const lastRun = [1, "ellipsis-start", 21, 22, 23, 24, 25]
    expect(getVisiblePages(25, 25)).toEqual(lastRun)
    expect(getVisiblePages(22, 25)).toEqual(lastRun)
  })

  it("never hides a single page behind an ellipsis", () => {
    // Page 5 is the first page where pages 2 and 3 are both hidden.
    expect(getVisiblePages(5, 25)).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      25,
    ])
  })

  it("keeps a constant length as the page changes", () => {
    for (let page = 1; page <= 25; page++) {
      expect(getVisiblePages(page, 25)).toHaveLength(7)
    }
  })
})
