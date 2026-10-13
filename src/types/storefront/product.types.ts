export type StorefrontProductImage = {
  src: string
  /** Intrinsic size of the file; it fixes the aspect ratio before the image loads. */
  width: number
  height: number
  /** What the picture shows. The product name is already in the surrounding link text. */
  alt: string
}

export type StorefrontProduct = {
  id: string
  name: string
  subtitle: string
  /** Price in US dollars. */
  price: number
  image: StorefrontProductImage
  /** A wide tile spans two catalog columns whenever the layout has room for it. */
  tile: "default" | "wide"
}
