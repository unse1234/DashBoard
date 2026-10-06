import {
  getProductDisplayStatus,
  getProductMargin,
} from "@/lib/products/product.utils"

describe("getProductDisplayStatus", () => {
  it("keeps the status of a product that is in stock", () => {
    expect(getProductDisplayStatus({ status: "active", stock: 5 })).toBe("active")
    expect(getProductDisplayStatus({ status: "inactive", stock: 5 })).toBe(
      "inactive"
    )
  })

  it("shows an active product without stock as out of stock", () => {
    expect(getProductDisplayStatus({ status: "active", stock: 0 })).toBe(
      "out-of-stock"
    )
  })

  it("lets inactive win over out of stock", () => {
    expect(getProductDisplayStatus({ status: "inactive", stock: 0 })).toBe(
      "inactive"
    )
  })
})

describe("getProductMargin", () => {
  it("is the profit as a share of the selling price", () => {
    expect(getProductMargin({ price: 200, costPrice: 150 })).toBe(0.25)
  })

  it("can be negative when the cost exceeds the price", () => {
    expect(getProductMargin({ price: 100, costPrice: 120 })).toBe(-0.2)
  })

  it("is unavailable without a cost price", () => {
    expect(getProductMargin({ price: 100, costPrice: null })).toBeNull()
  })

  it("is unavailable for a free product", () => {
    expect(getProductMargin({ price: 0, costPrice: 5 })).toBeNull()
  })
})
