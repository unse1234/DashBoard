import type {
  ProductDisplayStatus,
  ProductStatus,
  ProductStatusFilter,
} from "@/types/product.types"

/** The category filter's value for "no category filter". */
export const ALL_CATEGORIES = "all"

/** The API's answer (409) when another product already has the SKU. */
export const SKU_TAKEN_MESSAGE = "A product with this SKU already exists"

export const PRODUCT_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  "out-of-stock": "Out of Stock",
} as const satisfies Record<ProductDisplayStatus, string>

/** The statuses an admin can choose between when editing a product. */
export const PRODUCT_STATUS_OPTIONS = [
  { value: "active", label: PRODUCT_STATUS_LABELS.active },
  { value: "inactive", label: PRODUCT_STATUS_LABELS.inactive },
] as const satisfies readonly { value: ProductStatus; label: string }[]

export const PRODUCT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: PRODUCT_STATUS_LABELS.active },
  { value: "inactive", label: PRODUCT_STATUS_LABELS.inactive },
  { value: "out-of-stock", label: PRODUCT_STATUS_LABELS["out-of-stock"] },
] as const satisfies readonly { value: ProductStatusFilter; label: string }[]
