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

export function formatStorefrontPrice(amount: number) {
  return `$ ${priceFormatter.format(amount)}`
}

export function formatStorefrontTotal(amount: number) {
  return `$ ${totalFormatter.format(amount)}`
}
