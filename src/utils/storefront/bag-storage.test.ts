import { vi } from "vitest"

import {
  BAG_STORAGE_KEY,
  loadBagDraft,
  saveBagDraft,
} from "@/utils/storefront/bag-storage"

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("bag storage", () => {
  it("restores what was saved", () => {
    saveBagDraft([
      { productId: "PRD-1001", quantity: 2 },
      { productId: "PRD-1002", quantity: 1 },
    ])

    expect(loadBagDraft()).toEqual([
      { productId: "PRD-1001", quantity: 2 },
      { productId: "PRD-1002", quantity: 1 },
    ])
  })

  it("stores only product ids and quantities", () => {
    saveBagDraft([{ productId: "PRD-1001", quantity: 2 }])

    expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBe(
      '[{"productId":"PRD-1001","quantity":2}]'
    )
  })

  it("forgets an emptied bag instead of keeping an empty list", () => {
    saveBagDraft([{ productId: "PRD-1001", quantity: 2 }])
    saveBagDraft([])

    expect(window.localStorage.getItem(BAG_STORAGE_KEY)).toBeNull()
    expect(loadBagDraft()).toEqual([])
  })

  it("folds the case of an id", () => {
    window.localStorage.setItem(
      BAG_STORAGE_KEY,
      JSON.stringify([{ productId: "prd-7", quantity: 1 }])
    )

    expect(loadBagDraft()).toEqual([{ productId: "PRD-7", quantity: 1 }])
  })

  it.each([
    ["not JSON", "{oops"],
    ["not a list", '{"productId":"PRD-1","quantity":1}'],
    ["a line that is not an object", "[1]"],
    ["an id that is not one", '[{"productId":"X","quantity":1}]'],
    ["a zero quantity", '[{"productId":"PRD-1","quantity":0}]'],
    ["a fractional quantity", '[{"productId":"PRD-1","quantity":1.5}]'],
    ["a quantity past the limit", '[{"productId":"PRD-1","quantity":1001}]'],
    ["a quantity that is a string", '[{"productId":"PRD-1","quantity":"2"}]'],
    [
      "a repeated product",
      '[{"productId":"PRD-1","quantity":1},{"productId":"prd-1","quantity":1}]',
    ],
  ])("drops a bag that is %s", (_label, stored) => {
    window.localStorage.setItem(BAG_STORAGE_KEY, stored)

    expect(loadBagDraft()).toEqual([])
  })

  it("drops a bag with more lines than the API allows", () => {
    const lines = Array.from({ length: 101 }, (_, index) => ({
      productId: `PRD-${index + 1}`,
      quantity: 1,
    }))
    window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(lines))

    expect(loadBagDraft()).toEqual([])
  })

  it("works without storage: reading gives an empty bag and saving does nothing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(loadBagDraft()).toEqual([])
    expect(() =>
      saveBagDraft([{ productId: "PRD-1001", quantity: 1 }])
    ).not.toThrow()
  })
})
