import { getNextSort } from "@/lib/sort"

describe("getNextSort", () => {
  it("starts a column ascending, then descending, then clears it", () => {
    const ascending = getNextSort(null, "name")
    expect(ascending).toEqual({ column: "name", direction: "asc" })

    const descending = getNextSort(ascending, "name")
    expect(descending).toEqual({ column: "name", direction: "desc" })

    expect(getNextSort(descending, "name")).toBeNull()
  })

  it("switches to a different column ascending so only one is sorted", () => {
    const sorted = getNextSort({ column: "name", direction: "desc" }, "email")
    expect(sorted).toEqual({ column: "email", direction: "asc" })
  })
})
