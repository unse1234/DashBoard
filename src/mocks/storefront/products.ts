import type { StorefrontProduct } from "@/types/storefront/product.types"

// Test fixtures for the screens that are not on the API yet (the bag and
// checkout). The catalog and product details read the real API; nothing here
// is shown to a shopper any more. The files are the 1x design crops in
// public/images/storefront/products, which a product's imageUrl may point at.
const IMAGE_DIRECTORY = "/images/storefront/products"

function mockProduct(
  fields: Pick<StorefrontProduct, "id" | "name" | "subtitle" | "price"> & {
    file: string
    alt: string
  }
): StorefrontProduct {
  const { file, alt, ...product } = fields
  return {
    ...product,
    description: null,
    brand: null,
    category: { id: "mock-category", name: "Electronics" },
    currency: "USD",
    image: { url: `${IMAGE_DIRECTORY}/${file}`, alt },
    gallery: [],
    inStock: true,
  }
}

export const appleWatchSeries5 = mockProduct({
  id: "apple-watch-series-5-se",
  name: "Apple Watch",
  subtitle: "Series 5 SE",
  price: 529.99,
  file: "apple-watch-series-5-se.png",
  alt: "Smartwatch with a dark band and an orange wallpaper on its face",
})

export const sonyZx330bt = mockProduct({
  id: "sony-zx330bt-light-grey",
  name: "Sony ZX330BT",
  subtitle: "Light Grey",
  price: 39.99,
  file: "sony-zx330bt-light-grey.png",
  alt: "Light grey wired over-ear headphones",
})

export const iphone11SeriousBlack = mockProduct({
  id: "iphone-11-serious-black",
  name: "iPhone 11",
  subtitle: "Serious Black",
  price: 619.99,
  file: "iphone-11-serious-black.png",
  alt: "Black smartphone with a dual camera, shown from the back and the front",
})

export const iphone11SubwayBlue = mockProduct({
  id: "iphone-11-subway-blue",
  name: "iPhone 11",
  subtitle: "Subway Blue",
  price: 619.99,
  file: "iphone-11-subway-blue.png",
  alt: "Mint green smartphone with a dual camera, shown from the back and the front",
})

export const macbookPro16 = mockProduct({
  id: "macbook-pro-16-silver-m1-pro",
  name: "MacBook Pro 16”",
  subtitle: "Silver - M1 Pro",
  price: 3249.99,
  file: "macbook-pro-16-silver-m1-pro.png",
  alt: "Silver laptop open to a purple and pink wallpaper",
})

export const iphone11ProductRed = mockProduct({
  id: "iphone-11-product-red",
  name: "iPhone 11",
  subtitle: "Product RED",
  price: 619.99,
  file: "iphone-11-product-red.png",
  alt: "Red smartphone with a dual camera, shown from the back and the front",
})

export const iphone11MilkyWhite = mockProduct({
  id: "iphone-11-milky-white",
  name: "iPhone 11",
  subtitle: "Milky White",
  price: 619.99,
  file: "iphone-11-milky-white.png",
  alt: "White smartphone with a dual camera, shown from the back and the front",
})
