// Fixed locale so the server and the browser render identical text. An amount
// is shown in the currency it was recorded in, as the API reports it.
const currencyFormatters = new Map<string, Intl.NumberFormat>()

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

/** Format the API's recorded currency, including legacy records outside the form's choices. */
export function formatCurrency(
  amount: number,
  currency: string | null | undefined
) {
  const code = typeof currency === "string" ? currency.trim().toUpperCase() : ""
  // An incomplete API response must not crash a page or guess a currency.
  if (!/^[A-Z]{3}$/.test(code)) return amountFormatter.format(amount)

  let formatter = currencyFormatters.get(code)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      // Currency fraction defaults differ across browser/Node locale data.
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    currencyFormatters.set(code, formatter)
  }
  return formatter.format(amount)
}

export function formatInteger(value: number) {
  return integerFormatter.format(value)
}

/** Takes a ratio, so `0.255` renders as "25.5%". */
export function formatPercent(ratio: number) {
  return percentFormatter.format(ratio)
}
