import {
  formatStorefrontPrice,
  formatStorefrontTotal,
} from "@/utils/storefront/format-price"

describe("formatStorefrontPrice", () => {
  it("writes a space after the symbol and two decimals", () => {
    expect(formatStorefrontPrice(529.99, "USD")).toBe("$ 529.99")
    expect(formatStorefrontPrice(40, "USD")).toBe("$ 40.00")
  })

  it("does not group dollar thousands, as in the design", () => {
    expect(formatStorefrontPrice(3249.99, "USD")).toBe("$ 3249.99")
  })

  it("writes rupees with Rs and groups them, since they run to many digits", () => {
    expect(formatStorefrontPrice(1500, "PKR")).toBe("Rs 1,500.00")
    expect(formatStorefrontPrice(159999.5, "PKR")).toBe("Rs 159,999.50")
    expect(formatStorefrontPrice(0.1, "PKR")).toBe("Rs 0.10")
  })
})

describe("formatStorefrontTotal", () => {
  it("groups thousands, as the bag total does in the design", () => {
    expect(formatStorefrontTotal(5849.93, "USD")).toBe("$ 5,849.93")
    expect(formatStorefrontTotal(5849.93, "PKR")).toBe("Rs 5,849.93")
  })

  it("keeps the space and two decimals", () => {
    expect(formatStorefrontTotal(0, "USD")).toBe("$ 0.00")
    expect(formatStorefrontTotal(619.9, "PKR")).toBe("Rs 619.90")
  })
})
