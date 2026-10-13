import type { StorefrontProduct } from "@/types/storefront/product.types"

const IMAGE_DIRECTORY = "/images/storefront/products"

// Image files are the tile area of the design, so regular products are 175 × 216
// and the laptop, which spans two columns, is 412 × 216.
const REGULAR_IMAGE_SIZE = { width: 175, height: 216 }

export const appleWatchSeries5: StorefrontProduct = {
  id: "apple-watch-series-5-se",
  name: "Apple Watch",
  subtitle: "Series 5 SE",
  price: 529.99,
  image: {
    src: `${IMAGE_DIRECTORY}/apple-watch-series-5-se.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "Smartwatch with a dark band and an orange wallpaper on its face",
  },
  tile: "default",
}

export const sonyZx330bt: StorefrontProduct = {
  id: "sony-zx330bt-light-grey",
  name: "Sony ZX330BT",
  subtitle: "Light Grey",
  price: 39.99,
  image: {
    src: `${IMAGE_DIRECTORY}/sony-zx330bt-light-grey.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "Light grey wired over-ear headphones",
  },
  tile: "default",
}

export const iphone11SeriousBlack: StorefrontProduct = {
  id: "iphone-11-serious-black",
  name: "iPhone 11",
  subtitle: "Serious Black",
  price: 619.99,
  image: {
    src: `${IMAGE_DIRECTORY}/iphone-11-serious-black.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "Black smartphone with a dual camera, shown from the back and the front",
  },
  tile: "default",
}

export const iphone11SubwayBlue: StorefrontProduct = {
  id: "iphone-11-subway-blue",
  name: "iPhone 11",
  subtitle: "Subway Blue",
  price: 619.99,
  image: {
    src: `${IMAGE_DIRECTORY}/iphone-11-subway-blue.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "Mint green smartphone with a dual camera, shown from the back and the front",
  },
  tile: "default",
}

export const macbookPro16: StorefrontProduct = {
  id: "macbook-pro-16-silver-m1-pro",
  name: "MacBook Pro 16”",
  subtitle: "Silver - M1 Pro",
  price: 3249.99,
  image: {
    src: `${IMAGE_DIRECTORY}/macbook-pro-16-silver-m1-pro.png`,
    width: 412,
    height: 216,
    alt: "Silver laptop open to a purple and pink wallpaper",
  },
  tile: "wide",
}

export const iphone11ProductRed: StorefrontProduct = {
  id: "iphone-11-product-red",
  name: "iPhone 11",
  subtitle: "Product RED",
  price: 619.99,
  image: {
    src: `${IMAGE_DIRECTORY}/iphone-11-product-red.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "Red smartphone with a dual camera, shown from the back and the front",
  },
  tile: "default",
}

export const iphone11MilkyWhite: StorefrontProduct = {
  id: "iphone-11-milky-white",
  name: "iPhone 11",
  subtitle: "Milky White",
  price: 619.99,
  image: {
    src: `${IMAGE_DIRECTORY}/iphone-11-milky-white.png`,
    ...REGULAR_IMAGE_SIZE,
    alt: "White smartphone with a dual camera, shown from the back and the front",
  },
  tile: "default",
}

/** In catalog order. */
export const storefrontProducts: StorefrontProduct[] = [
  appleWatchSeries5,
  sonyZx330bt,
  iphone11SeriousBlack,
  iphone11SubwayBlue,
  macbookPro16,
  iphone11ProductRed,
  iphone11MilkyWhite,
]
