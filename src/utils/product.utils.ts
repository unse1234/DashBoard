import type {
  Product,
  ProductDisplayStatus,
} from "@/types/product.types"

/** An inactive product is not for sale whatever its stock, so inactive wins. */
export function getProductDisplayStatus(
  product: Pick<Product, "status" | "stock">
): ProductDisplayStatus {
  if (product.status === "inactive") return "inactive"
  return product.stock === 0 ? "out-of-stock" : "active"
}
