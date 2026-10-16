/**
 * The shop's current trading currency. API records retain the currency they
 * were saved in, described separately by RecordedCurrency below.
 */
export type Currency = "PKR"

/** Existing API records can still be denominated in USD. Never relabel their amounts. */
export type RecordedCurrency = Currency | "USD"
