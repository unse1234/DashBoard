import type {
  StorefrontCurrency,
  StorefrontProduct,
} from "@/types/storefront/product.types"

/**
 * What the client keeps of a bag: which products and how many, exactly as the
 * server last returned them. Prices, totals and counts are never kept here.
 */
export type BagDraftLine = {
  /** Public id, "PRD-1001". */
  productId: string
  quantity: number
}

/**
 * Why a line cannot be bought as it stands. `CURRENCY_MISMATCH`: it is priced
 * in another currency than the bag's first product, and an order has one.
 */
export type BagLineIssue =
  | "PRODUCT_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "CURRENCY_MISMATCH"

/** A bag line priced by the server. */
export type BagLine = {
  productId: string
  quantity: number
  /** Null when the product is not for sale: nothing about it is revealed. */
  product: StorefrontProduct | null
  unitPrice: number | null
  lineTotal: number | null
  issue: BagLineIssue | null
}

/** The server's answer for a bag: the canonical lines, priced, with counts. */
export type BagQuote = {
  currency: StorefrontCurrency
  items: BagLine[]
  /** Of the lines that are for sale; informational, it reserves no stock. */
  subtotal: number
  /** Distinct products. */
  lineCount: number
  /** Units across all lines. */
  unitCount: number
  /** True when a line cannot be bought as it stands. */
  hasIssues: boolean
}

export type BagActionType = "add" | "increment" | "decrement" | "set" | "remove"

/** What the shopper did. The server applies it; the client never does. */
export type BagAction = {
  type: BagActionType
  productId: string
  /** For `add` (default 1) and `set` (required). */
  quantity?: number
}
