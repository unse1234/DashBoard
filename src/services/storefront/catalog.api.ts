import { apiClient } from "@/lib/api/axios"
import type {
  StorefrontProduct,
  StorefrontProductPage,
  StorefrontProductsQuery,
} from "@/types/storefront/product.types"

type ProductPageResponse = {
  data: StorefrontProduct[]
  meta: StorefrontProductPage["meta"]
}

export function buildStorefrontProductsParams({
  search,
  page,
  pageSize,
  sort,
  categoryId,
}: StorefrontProductsQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
  })
  if (search.trim()) params.set("search", search.trim())
  if (categoryId) params.set("categoryId", categoryId)
  return params
}

// The public catalog needs no sign-in. `skipAuth` keeps a staff token (the
// dashboard and the storefront share a browser) off these requests, and keeps
// a 401 from starting a session refresh: there is no session to refresh here.

/**
 * One page of the catalog. Search, sort and paging happen on the server; the
 * page and its `meta` are rendered as returned.
 */
export async function listStorefrontProducts(
  query: StorefrontProductsQuery,
  signal?: AbortSignal
): Promise<StorefrontProductPage> {
  const { data } = await apiClient.get<ProductPageResponse>(
    "/storefront/products",
    { params: buildStorefrontProductsParams(query), signal, skipAuth: true }
  )
  return { products: data.data, meta: data.meta }
}

/** One visible product. Anything the shop does not show is a 404. */
export async function getStorefrontProduct(
  productId: string,
  signal?: AbortSignal
): Promise<StorefrontProduct> {
  const { data } = await apiClient.get<StorefrontProduct>(
    `/storefront/products/${encodeURIComponent(productId)}`,
    { signal, skipAuth: true }
  )
  return data
}
