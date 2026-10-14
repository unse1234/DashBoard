import type { Currency } from "@/types/currency.types"

// Fixed locale so the server and the browser render identical text. The
// currency is never assumed: an amount is shown in the currency it was
// recorded in, so a rupee price can't be mistaken for a dollar one.
const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  PKR: new Intl.NumberFormat("en-US", { style: "currency", currency: "PKR" }),
}

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

/** `amount` in `currency`, e.g. "$1,500.00" or "PKR 1,500.00". */
export function formatCurrency(amount: number, currency: Currency) {
  return currencyFormatters[currency].format(amount)
}

export function formatInteger(value: number) {
  return integerFormatter.format(value)
}

/** Takes a ratio, so `0.255` renders as "25.5%". */
export function formatPercent(ratio: number) {
  return percentFormatter.format(ratio)
}
