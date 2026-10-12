import type { PageSize } from "@/lib/pagination"

/** The status an admin sets on a product. */
export type ProductStatus = "active" | "inactive"

/**
 * What the list and details show. Running out of stock is not a status anyone
 * sets, so "out-of-stock" is derived from `stock` (see `getProductDisplayStatus`).
 */
export type ProductDisplayStatus = ProductStatus | "out-of-stock"

export type Product = {
  /** Public identifier, also used in the details and edit routes. */
  id: string
  name: string
  sku: string
  description: string | null
  /** The category's identifier, as the form and the category filter use it. */
  categoryId: string
  /** The category's name, for display. */
  category: string
  brand: string | null
  status: ProductStatus
  /** Selling price in USD. */
  price: number
  /** What the product costs the business in USD; null when unknown. */
  costPrice: number | null
  stock: number
  /**
   * Changes with every write, orders included. An edit sends the version it was
   * made from, and the API refuses it if the product has changed since.
   */
  version: number
  /** ISO 8601 timestamps. */
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: string
  name: string
}

export type ProductHistoryEntry = {
  id: string
  /** What happened, already phrased for display. */
  change: string
  /** ISO 8601 timestamp. */
  occurredAt: string
  /** The admin responsible; null for automatic changes. */
  actor: string | null
}

export type ProductStatusFilter = ProductDisplayStatus | "all"

/** Everything that decides which products are listed; maps 1:1 to the API's query parameters. */
export type ProductsQuery = {
  search: string
  /** A category's identifier, or "all" for no category filter. */
  category: string
  status: ProductStatusFilter
  page: number
  pageSize: PageSize
}
