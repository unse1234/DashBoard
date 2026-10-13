import type {
  StorefrontProduct,
  StorefrontProductImage,
} from "@/types/storefront/product.types"

/** What the item view shows about a catalog product beyond its catalog tile. */
export type ProductDetails = {
  product: StorefrontProduct
  /** Average review score from 0 to 5; halves are drawn. */
  rating: number
  /** The short blurb beside the image. */
  summary: string
  /** The long description, one entry per paragraph. */
  description: string[]
  /** One picture per thumbnail; the first is shown until another is chosen. */
  gallery: StorefrontProductImage[]
}
