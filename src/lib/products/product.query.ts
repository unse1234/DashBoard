import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import { ALL_CATEGORIES } from "@/lib/products/product.constants"
import type { ProductsQuery } from "@/lib/products/product.types"

export const defaultProductsQuery: ProductsQuery = {
  search: "",
  category: ALL_CATEGORIES,
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
