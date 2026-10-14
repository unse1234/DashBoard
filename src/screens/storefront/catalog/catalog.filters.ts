import type { StorefrontProductsQuery } from "@/types/storefront/product.types"

/**
 * Twenty-four fills whole rows at every grid width the catalog uses (2, 3 and 4
 * columns). The API allows up to 100.
 */
export const CATALOG_PAGE_SIZE = 24

export const defaultCatalogQuery: StorefrontProductsQuery = {
  search: "",
  page: 1,
  pageSize: CATALOG_PAGE_SIZE,
  sort: "newest",
}
