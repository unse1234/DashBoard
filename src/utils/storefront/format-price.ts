import type { StorefrontCurrency } from "@/types/storefront/product.types"

// The design writes prices as "$ 3249.99": a space after the symbol and no
// thousands separator, so `formatCurrency` ("$3,249.99") is not used here.
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
})

// The bag total is the one figure the design groups: "$ 5,849.93".
const totalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const SYMBOLS: Record<StorefrontCurrency, string> = {
  PKR: "Rs",
  USD: "$",
}

/**
 * A unit price in the product's own currency. Rupee amounts run to five and six
 * digits, so they are grouped ("Rs 159,999.00") where the design's dollar prices
 * are not; without grouping they cannot be read at a glance.
 */
export function formatStorefrontPrice(
  amount: number,
  currency: StorefrontCurrency
) {
  const formatter = currency === "USD" ? priceFormatter : totalFormatter
  return `${SYMBOLS[currency]} ${formatter.format(amount)}`
}

export function formatStorefrontTotal(
  amount: number,
  currency: StorefrontCurrency
) {
  return `${SYMBOLS[currency]} ${totalFormatter.format(amount)}`
}
