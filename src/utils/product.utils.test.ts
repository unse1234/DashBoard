import { getProductDisplayStatus } from "@/utils/product.utils"

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
