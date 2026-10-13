import { demoBagReviewItems } from "@/mocks/storefront/bag"
import { iphone11SeriousBlack, macbookPro16 } from "@/mocks/storefront/products"
import type { BagItem } from "@/types/storefront/bag.types"
import {
  addProductToBag,
  changeBagItemQuantity,
  getBagItemCount,
  getBagTotal,
} from "@/utils/storefront/bag.utils"

describe("addProductToBag", () => {
  it("appends a product that is not in the bag, with quantity one", () => {
    const items: BagItem[] = [{ product: macbookPro16, quantity: 1 }]

    expect(addProductToBag(items, iphone11SeriousBlack)).toEqual([
      { product: macbookPro16, quantity: 1 },
      { product: iphone11SeriousBlack, quantity: 1 },
    ])
  })

  it("raises the quantity of a product already in the bag instead of duplicating it", () => {
    const items: BagItem[] = [
      { product: macbookPro16, quantity: 1 },
      { product: iphone11SeriousBlack, quantity: 2 },
    ]

    const next = addProductToBag(items, iphone11SeriousBlack)

    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ product: iphone11SeriousBlack, quantity: 3 })
  })

  it("keeps the order of the bag when a quantity changes", () => {
    const items: BagItem[] = [
      { product: macbookPro16, quantity: 1 },
      { product: iphone11SeriousBlack, quantity: 1 },
    ]

    const next = addProductToBag(items, macbookPro16)

    expect(next.map((item) => item.product.id)).toEqual([
      macbookPro16.id,
      iphone11SeriousBlack.id,
    ])
  })

  it("does not change the bag it was given", () => {
    const items: BagItem[] = [{ product: macbookPro16, quantity: 1 }]

    addProductToBag(items, macbookPro16)
    addProductToBag(items, iphone11SeriousBlack)

    expect(items).toEqual([{ product: macbookPro16, quantity: 1 }])
  })
})

describe("changeBagItemQuantity", () => {
  const items: BagItem[] = [
    { product: macbookPro16, quantity: 1 },
    { product: iphone11SeriousBlack, quantity: 2 },
  ]

  it("raises and lowers one line, keeping the order", () => {
    const up = changeBagItemQuantity(items, iphone11SeriousBlack.id, 1)
    expect(up.map((item) => item.quantity)).toEqual([1, 3])

    const down = changeBagItemQuantity(items, iphone11SeriousBlack.id, -1)
    expect(down.map((item) => item.quantity)).toEqual([1, 1])
    expect(down.map((item) => item.product.id)).toEqual([
      macbookPro16.id,
      iphone11SeriousBlack.id,
    ])
  })

  it("removes a line whose quantity would reach zero", () => {
    const next = changeBagItemQuantity(items, macbookPro16.id, -1)

    expect(next).toEqual([{ product: iphone11SeriousBlack, quantity: 2 }])
  })

  it("changes nothing for a product that is not in the bag", () => {
    expect(changeBagItemQuantity(items, "not-in-the-bag", 1)).toEqual(items)
  })

  it("does not change the bag it was given", () => {
    changeBagItemQuantity(items, macbookPro16.id, -1)
    changeBagItemQuantity(items, iphone11SeriousBlack.id, 5)

    expect(items.map((item) => item.quantity)).toEqual([1, 2])
  })
})

describe("getBagTotal", () => {
  it("multiplies each price by its quantity and adds the lines", () => {
    expect(
      getBagTotal([
        { product: macbookPro16, quantity: 2 },
        { product: iphone11SeriousBlack, quantity: 1 },
      ])
    ).toBe(7119.97)
  })

  it("comes to the bag design's total for its four lines", () => {
    expect(getBagTotal(demoBagReviewItems)).toBe(5849.93)
  })

  it("is zero for an empty bag", () => {
    expect(getBagTotal([])).toBe(0)
  })
})

describe("getBagItemCount", () => {
  it("adds up units, not distinct products", () => {
    expect(
      getBagItemCount([
        { product: macbookPro16, quantity: 2 },
        { product: iphone11SeriousBlack, quantity: 3 },
      ])
    ).toBe(5)
  })

  it("is zero for an empty bag", () => {
    expect(getBagItemCount([])).toBe(0)
  })
})
