import type { StorefrontProduct } from "@/types/storefront/product.types"

/** "Name, Subtitle", or just the name for a product without a subtitle. */
export function getProductLabel(
  product: Pick<StorefrontProduct, "name" | "subtitle">
) {
  return product.subtitle
    ? `${product.name}, ${product.subtitle}`
    : product.name
}

/**
 * A description split into paragraphs at its line breaks, empty lines dropped.
 * Only presentation: the text itself is the API's, unchanged.
 */
export function splitParagraphs(text: string | null) {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "")
}
