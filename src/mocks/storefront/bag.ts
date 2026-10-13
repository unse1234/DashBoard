import {
  iphone11MilkyWhite,
  iphone11SeriousBlack,
  iphone11SubwayBlue,
  macbookPro16,
} from "@/mocks/storefront/products"
import type { BagItem } from "@/types/storefront/bag.types"
import type { StorefrontProduct } from "@/types/storefront/product.types"

/** The four single items matching the catalog design's bag thumbnails. */
export const demoBagItems: BagItem[] = [
  { product: macbookPro16, quantity: 1 },
  { product: iphone11SubwayBlue, quantity: 1 },
  { product: iphone11MilkyWhite, quantity: 1 },
  { product: iphone11SeriousBlack, quantity: 1 },
]

// The bag design's first and second lines are products the catalog does not
// list, so they are not in `storefrontProducts` and have no item view. Their
// pictures are 236 × 272 canvases, the image column of a bag line.
const BAG_IMAGE_DIRECTORY = "/images/storefront/products"

export const dellXps13White: StorefrontProduct = {
  id: "dell-xps-13-white",
  name: "Dell XPS 13",
  subtitle: "White",
  price: 1799.99,
  image: {
    src: `${BAG_IMAGE_DIRECTORY}/dell-xps-13-white.png`,
    width: 236,
    height: 272,
    alt: "White laptop open to a teal and orange marble wallpaper",
  },
  tile: "wide",
}

export const iphone11NavyBlue: StorefrontProduct = {
  id: "iphone-11-navy-blue",
  name: "iPhone 11",
  subtitle: "Navy Blue",
  price: 729.99,
  image: {
    src: `${BAG_IMAGE_DIRECTORY}/iphone-11-navy-blue.png`,
    width: 236,
    height: 272,
    alt: "Navy blue smartphone with a dual camera, shown from the back and the front",
  },
  tile: "default",
}

/**
 * The bag of the bag design: four lines, seven units, "$ 5,849.93". The
 * storefront layout starts every visitor with it, so the catalog's bag preview
 * and the bag screen show the same thumbnails as their designs.
 */
export const demoBagReviewItems: BagItem[] = [
  { product: dellXps13White, quantity: 1 },
  { product: iphone11NavyBlue, quantity: 3 },
  { product: iphone11MilkyWhite, quantity: 1 },
  { product: iphone11SeriousBlack, quantity: 2 },
]

/** The design's placeholder line under each product's name in the bag. */
export const demoBagLineBlurb =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam"
