import {
  iphone11MilkyWhite,
  iphone11SeriousBlack,
  iphone11SubwayBlue,
  macbookPro16,
} from "@/mocks/storefront/products"
import type { BagItem } from "@/types/storefront/bag.types"
import type { StorefrontProduct } from "@/types/storefront/product.types"

// Test fixtures for the bag and checkout screens, which are not on the API yet.
// The storefront starts every visitor with an empty bag.

/** Four single items. */
export const demoBagItems: BagItem[] = [
  { product: macbookPro16, quantity: 1 },
  { product: iphone11SubwayBlue, quantity: 1 },
  { product: iphone11MilkyWhite, quantity: 1 },
  { product: iphone11SeriousBlack, quantity: 1 },
]

// The bag design's first and second lines are products the catalog design does
// not list. Their pictures are 236 × 272 canvases, the image column of a bag line.
const BAG_IMAGE_DIRECTORY = "/images/storefront/products"

export const dellXps13White: StorefrontProduct = {
  id: "dell-xps-13-white",
  name: "Dell XPS 13",
  subtitle: "White",
  description: null,
  brand: null,
  category: { id: "mock-category", name: "Electronics" },
  price: 1799.99,
  currency: "USD",
  image: {
    url: `${BAG_IMAGE_DIRECTORY}/dell-xps-13-white.png`,
    alt: "White laptop open to a teal and orange marble wallpaper",
  },
  gallery: [],
  inStock: true,
}

export const iphone11NavyBlue: StorefrontProduct = {
  id: "iphone-11-navy-blue",
  name: "iPhone 11",
  subtitle: "Navy Blue",
  description: null,
  brand: null,
  category: { id: "mock-category", name: "Electronics" },
  price: 729.99,
  currency: "USD",
  image: {
    url: `${BAG_IMAGE_DIRECTORY}/iphone-11-navy-blue.png`,
    alt: "Navy blue smartphone with a dual camera, shown from the back and the front",
  },
  gallery: [],
  inStock: true,
}

/** Four lines, seven units, "$ 5,849.93": the bag of the bag design. */
export const demoBagReviewItems: BagItem[] = [
  { product: dellXps13White, quantity: 1 },
  { product: iphone11NavyBlue, quantity: 3 },
  { product: iphone11MilkyWhite, quantity: 1 },
  { product: iphone11SeriousBlack, quantity: 2 },
]
