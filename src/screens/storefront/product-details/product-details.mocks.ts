import {
  macbookPro16,
  sonyZx330bt,
  storefrontProducts,
} from "@/mocks/storefront/products"
import type { ProductDetails } from "@/screens/storefront/product-details/product-details.types"

// The design shows three views of the product. The catalog has one picture per
// product, so every thumbnail repeats it until products have real galleries.
const GALLERY_VIEW_COUNT = 3

// The design's placeholder copy, shared by every product until real copy exists.
const PLACEHOLDER_SUMMARY =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis pellentesque tellus imperdiet mattis. Proin in quis ipsum non amet imperdiet. Dignissim nisi leo a at. Sit nec lacus, nunc volutpat, tincidunt lorem mi duis. Vitae elementum libero."

const PLACEHOLDER_DESCRIPTION = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dignissim odio faucibus nec malesuada purus volutpat vel sed viverra. Id sagittis, phasellus dui in arcu. Nec arcu, sit nunc, nibh purus pellentesque sagittis. Felis rhoncus facilisis massa eget purus in purus. Etiam at cras nulla nunc. Malesuada in pretium diam scelerisque sit mattis in egestas neque. Eu porta tempor sodales nisl integer turpis porttitor sed sed. Ut senectus odio dictum enim velit tempor diam quisque suspendisse.",
  "Orci vel ridiculus diam viverra. Libero malesuada orci, quis placerat suscipit augue imperdiet. Et praesent augue dictum mauris eget lacus malesuada. Aenean nisi, sodales natoque massa magna dignissim mi. Mattis tellus, justo, lorem sed tempor diam sit viverra enim. Id id placerat eu etiam nulla laoreet.",
  "Dignissim leo fames turpis quis suspendisse vulputate laoreet vulputate ac. Aliquam justo lectus eu dui porttitor. Cras a aliquam phasellus sollicitudin ornare. Tristique volutpat facilisis in ut proin. Est vitae facilisi sollicitudin id lorem mattis nibh ipsum, nec. Consectetur consectetur morbi morbi aliquet mi risus, velit, sit at. Integer morbi viverra hendrerit risus.",
  "Odio phasellus nibh senectus nec id enim quam sed. At potenti sollicitudin sollicitudin lobortis morbi. Nunc molestie et adipiscing aliquam. Sit vel mi dolor suscipit. In eget ut ac at facilisi leo viverra. Arcu ac ut fermentum, viverra et, vitae etiam cras. Eu purus non ut turpis fusce. Mi vitae nibh mi ut feugiat varius risus eros.",
]

// The design's score is 4.5. A few products differ so the star row is exercised
// with a whole score, a full score, and a half.
const DEFAULT_RATING = 4.5
const ratingsByProductId: Record<string, number> = {
  [sonyZx330bt.id]: 4,
  [macbookPro16.id]: 5,
}

/**
 * The item view of a catalog product, or undefined for an id the catalog does
 * not have. Every catalog product resolves, so a catalog link never dead-ends.
 */
export function getProductDetails(
  productId: string
): ProductDetails | undefined {
  const product = storefrontProducts.find((item) => item.id === productId)
  if (!product) return undefined

  return {
    product,
    rating: ratingsByProductId[product.id] ?? DEFAULT_RATING,
    summary: PLACEHOLDER_SUMMARY,
    description: PLACEHOLDER_DESCRIPTION,
    gallery: Array.from({ length: GALLERY_VIEW_COUNT }, () => product.image),
  }
}
