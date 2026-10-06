import type {
  Product,
  ProductDisplayStatus,
} from "@/lib/products/product.types"

/** An inactive product is not for sale whatever its stock, so inactive wins. */
export function getProductDisplayStatus(
  product: Pick<Product, "status" | "stock">
): ProductDisplayStatus {
  if (product.status === "inactive") return "inactive"
  return product.stock === 0 ? "out-of-stock" : "active"
}

/** Profit as a share of the selling price; null when it can't be worked out. */
export function getProductMargin(
  product: Pick<Product, "price" | "costPrice">
) {
  if (product.costPrice === null || product.price === 0) return null

  return (product.price - product.costPrice) / product.price
}
