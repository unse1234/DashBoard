import type { BagItem } from "@/types/storefront/bag.types"
import type { StorefrontProduct } from "@/types/storefront/product.types"

/**
 * A product already in the bag gains one unit; otherwise it is appended.
 * Returns a new array and leaves the one it was given untouched.
 */
export function addProductToBag(
  items: BagItem[],
  product: StorefrontProduct
): BagItem[] {
  const present = items.some((item) => item.product.id === product.id)
  if (!present) return [...items, { product, quantity: 1 }]

  return items.map((item) =>
    item.product.id === product.id
      ? { ...item, quantity: item.quantity + 1 }
      : item
  )
}

/**
 * Moves one line's quantity by `delta`. A line that would reach zero leaves the
 * bag, and an id that is not in the bag changes nothing.
 */
export function changeBagItemQuantity(
  items: BagItem[],
  productId: string,
  delta: number
): BagItem[] {
  return items.flatMap((item) => {
    if (item.product.id !== productId) return [item]
    const quantity = item.quantity + delta
    return quantity > 0 ? [{ ...item, quantity }] : []
  })
}

export function getBagItemCount(items: BagItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

/** Sum of price × quantity, added in cents so 0.1 + 0.2 style drift cannot show. */
export function getBagTotal(items: BagItem[]) {
  const cents = items.reduce(
    (total, item) =>
      total + Math.round(item.product.price * 100) * item.quantity,
    0
  )
  return cents / 100
}
