import type { ProductPage, ProductWriteValues, ApiProduct, Category, Product, ProductHistoryEntry, ProductStatus, ProductStatusFilter, ProductsQuery } from "@/types/product.types"
import { apiClient } from "@/lib/api/axios"
import { ALL_CATEGORIES } from "@/constants/product.constants"

// The API sends enums as stored, in upper case; the UI uses lower case.
type ApiProductStatus = "ACTIVE" | "INACTIVE"
type ApiProductStatusFilter = ApiProductStatus | "OUT_OF_STOCK"

type ProductPageResponse = {
  data: ApiProduct[]
  meta: { total: number }
}

const PRODUCT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const satisfies Record<ApiProductStatus, ProductStatus>

const API_STATUSES = {
  active: "ACTIVE",
  inactive: "INACTIVE",
} as const satisfies Record<ProductStatus, ApiProductStatus>

const API_STATUS_FILTERS = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  "out-of-stock": "OUT_OF_STOCK",
} as const satisfies Record<
  Exclude<ProductStatusFilter, "all">,
  ApiProductStatusFilter
>

export function toProduct(product: ApiProduct): Product {
  return { ...product, status: PRODUCT_STATUSES[product.status] }
}

export function buildProductsSearchParams({
  search,
  category,
  status,
  page,
  pageSize,
}: ProductsQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search.trim()) params.set("search", search.trim())
  if (category !== ALL_CATEGORIES) params.set("categoryId", category)
  if (status !== "all") params.set("status", API_STATUS_FILTERS[status])
  return params
}

/** What the form validated, in the API's spelling. */
function toProductPayload(values: ProductWriteValues) {
  return { ...values, status: API_STATUSES[values.status] }
}

function productPath(productId: string) {
  return `/products/${encodeURIComponent(productId)}`
}

// All of these need a signed-in user; the API client attaches the token.

export async function listProducts(
  query: ProductsQuery,
  signal?: AbortSignal
): Promise<ProductPage> {
  const { data } = await apiClient.get<ProductPageResponse>("/products", {
    params: buildProductsSearchParams(query),
    signal,
  })
  return { products: data.data.map(toProduct), totalRecords: data.meta.total }
}

export async function getProduct(productId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<ApiProduct>(productPath(productId), {
    signal,
  })
  return toProduct(data)
}

/** The product's latest changes, newest first. */
export async function getProductHistory(
  productId: string,
  signal?: AbortSignal
): Promise<ProductHistoryEntry[]> {
  const { data } = await apiClient.get<{ data: ProductHistoryEntry[] }>(
    `${productPath(productId)}/history`,
    { signal }
  )
  return data.data
}

export async function listCategories(
  signal?: AbortSignal
): Promise<Category[]> {
  const { data } = await apiClient.get<{ data: Category[] }>("/categories", {
    signal,
  })
  return data.data
}

export async function createProduct(values: ProductWriteValues) {
  const { data } = await apiClient.post<ApiProduct>(
    "/products",
    toProductPayload(values)
  )
  return toProduct(data)
}

/**
 * Saves the form's values on top of `version`, the version the form was
 * loaded from. The API answers 409 if the product has changed since.
 */
export async function updateProduct(
  productId: string,
  version: number,
  values: ProductWriteValues
) {
  const { data } = await apiClient.patch<ApiProduct>(productPath(productId), {
    version,
    ...toProductPayload(values),
  })
  return toProduct(data)
}

/**
 * "Delete": the products disappear from the catalogue but are kept, because
 * orders refer to them. Resolves to how many were archived by this call.
 */
export async function archiveProducts(productIds: string[]) {
  const { data } = await apiClient.post<{ archived: number }>(
    "/products/archive",
    { productIds }
  )
  return data.archived
}
