import { formatStorefrontPrice } from "@/utils/storefront/format-price"

describe("formatStorefrontPrice", () => {
  it("writes rupees with Rs, a space and two decimals", () => {
    expect(formatStorefrontPrice(1500, "PKR")).toBe("Rs 1,500.00")
    expect(formatStorefrontPrice(0, "PKR")).toBe("Rs 0.00")
    expect(formatStorefrontPrice(0.1, "PKR")).toBe("Rs 0.10")
  })

  it("groups thousands, since rupee amounts run to many digits", () => {
    expect(formatStorefrontPrice(5849.93, "PKR")).toBe("Rs 5,849.93")
    expect(formatStorefrontPrice(159999.5, "PKR")).toBe("Rs 159,999.50")
  })
})
