// Fixed locale and currency so the server and the browser render identical text.
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount)
}

export function formatInteger(value: number) {
  return integerFormatter.format(value)
}

/** Takes a ratio, so `0.255` renders as "25.5%". */
export function formatPercent(ratio: number) {
  return percentFormatter.format(ratio)
}
