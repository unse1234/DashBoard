import {
  formatStorefrontPrice,
  formatStorefrontTotal,
} from "@/utils/storefront/format-price"

describe("formatStorefrontPrice", () => {
  it("writes a space after the symbol and two decimals", () => {
    expect(formatStorefrontPrice(529.99)).toBe("$ 529.99")
    expect(formatStorefrontPrice(40)).toBe("$ 40.00")
  })

  it("does not group thousands, as in the design", () => {
    expect(formatStorefrontPrice(3249.99)).toBe("$ 3249.99")
  })
})

describe("formatStorefrontTotal", () => {
  it("groups thousands, as the bag total does in the design", () => {
    expect(formatStorefrontTotal(5849.93)).toBe("$ 5,849.93")
  })

  it("keeps the space and two decimals", () => {
    expect(formatStorefrontTotal(0)).toBe("$ 0.00")
    expect(formatStorefrontTotal(619.9)).toBe("$ 619.90")
  })
})
