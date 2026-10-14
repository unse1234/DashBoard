import type { Currency } from "@/types/currency.types"

/** The currencies a product can be priced in, in the order they are offered. */
export const CURRENCIES = ["USD", "PKR"] as const satisfies readonly Currency[]

export const CURRENCY_LABELS = {
  USD: "US dollar (USD)",
  PKR: "Pakistani rupee (PKR)",
} as const satisfies Record<Currency, string>

export const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency,
  label: CURRENCY_LABELS[currency],
}))
