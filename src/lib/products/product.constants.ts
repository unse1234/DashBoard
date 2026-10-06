import type {
  ProductDisplayStatus,
  ProductStatus,
  ProductStatusFilter,
} from "@/lib/products/product.types"

// Placeholder options until a categories API exists.
export const PRODUCT_CATEGORIES = [
  "Accessories",
  "Electronics",
  "Furniture",
  "Home & Kitchen",
  "Office Supplies",
  "Sports & Outdoors",
] as const

export const ALL_CATEGORIES = "all"

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({
  value: category,
  label: category,
}))

export const PRODUCT_CATEGORY_FILTER_OPTIONS = [
  { value: ALL_CATEGORIES, label: "All Categories" },
  ...PRODUCT_CATEGORY_OPTIONS,
]

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
