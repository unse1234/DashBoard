import type {
  StorefrontPageMeta,
  StorefrontProduct,
  StorefrontProductPage,
} from "@/types/storefront/product.types"

let sequence = 1000

/** A product as the public catalog API returns it; override what a test cares about. */
export function createStorefrontProduct(
  overrides: Partial<StorefrontProduct> = {}
): StorefrontProduct {
  sequence += 1
  const name = overrides.name ?? `Product ${sequence}`
  return {
    id: `PRD-${sequence}`,
    name,
    subtitle: null,
    description: null,
    brand: null,
    category: { id: "category-1", name: "Electronics" },
    price: 1500,
    currency: "PKR",
    image: { url: `/images/storefront/products/${sequence}.png`, alt: name },
    gallery: [],
    inStock: true,
    ...overrides,
  }
}

export function createStorefrontPage(
  products: StorefrontProduct[],
  meta: Partial<StorefrontPageMeta> = {}
): StorefrontProductPage {
  return {
    products,
    meta: {
      page: 1,
      pageSize: 24,
      total: products.length,
      totalPages: products.length === 0 ? 0 : 1,
      ...meta,
    },
  }
}

/** The body of `GET /storefront/products`, as the API sends it. */
export function toPageResponse(page: StorefrontProductPage) {
  return { data: page.products, meta: page.meta }
}
