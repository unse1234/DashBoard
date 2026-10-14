/**
 * The currencies an amount can be recorded in. Every amount the API returns
 * comes with the currency it is denominated in; amounts of different currencies
 * are never added together and no exchange rate is applied.
 */
export type Currency = "USD" | "PKR"
