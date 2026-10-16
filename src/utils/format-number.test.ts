import { describe, expect, it } from "vitest"
import { formatCurrency } from "./format-number"

describe("formatCurrency", () => {
  it("keeps rupee amounts in PKR", () => {
    expect(formatCurrency(1500, "PKR")).toBe("PKR\u00a01,500.00")
  })

  it("retains paisa instead of rounding PKR to whole rupees", () => {
    expect(formatCurrency(1799.9, "PKR")).toBe("PKR\u00a01,799.90")
    expect(formatCurrency(900.01, "PKR")).toBe("PKR\u00a0900.01")
  })

  it("formats USD returned by legacy product and order responses", () => {
    expect(formatCurrency(249, "USD")).toBe("$249.00")
    expect(formatCurrency(94.5, "USD")).toBe("$94.50")
  })

  it("handles another valid currency without an absent formatter lookup", () => {
    expect(formatCurrency(1500, "EUR")).toBe("€1,500.00")
  })

  it("normalizes currency codes and keeps repeated calls consistent", () => {
    expect(formatCurrency(1500, " pkr ")).toBe("PKR\u00a01,500.00")
    expect(formatCurrency(12.5, "USD")).toBe("$12.50")
    expect(formatCurrency(12.5, "USD")).toBe("$12.50")
  })

  it.each([undefined, null, "", "invalid", "toString", "__proto__", "US1"])(
    "renders the amount without guessing a currency for %s",
    (currency) => {
      expect(formatCurrency(1234.5, currency)).toBe("1,234.50")
    }
  )
})
