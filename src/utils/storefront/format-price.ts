import type { StorefrontCurrency } from "@/types/storefront/product.types"

// The design's shape: a symbol, a space, two decimals. Rupee amounts run to five
// and six digits, so they are grouped ("Rs 159,999.00"); without grouping they
// cannot be read at a glance. `formatCurrency` ("PKR 159,999.00") is the
// dashboard's format, not the shop's.
const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const SYMBOLS: Record<StorefrontCurrency, string> = {
  PKR: "Rs",
}

/** A price or a total in the storefront's format, e.g. "Rs 1,500.00". */
export function formatStorefrontPrice(
  amount: number,
  currency: StorefrontCurrency
) {
  return `${SYMBOLS[currency]} ${amountFormatter.format(amount)}`
}
