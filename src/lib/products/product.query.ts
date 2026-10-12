import { DEFAULT_PAGE_SIZE } from "@/constants/pagination.constants";
import { ALL_CATEGORIES } from "@/constants/product.constants"
import type { ProductsQuery } from "@/types/product.types"

export const defaultProductsQuery: ProductsQuery = {
  search: "",
  category: ALL_CATEGORIES,
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
