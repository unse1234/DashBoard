import Image from "next/image"
import Link from "next/link"

import { AddToBagButton } from "@/components/storefront/add-to-bag-button"
import { getShopProductRoute } from "@/config/routes"
import type { StorefrontProduct } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

type ProductCardProps = {
  product: StorefrontProduct
  /** For cards above the fold: loads the image without waiting to scroll. */
  eager?: boolean
}

// Tile proportions of the design: 191 × 232, and 430 × 232 across two columns.
const TILE_ASPECT = {
  default: "aspect-[191/232]",
  wide: "aspect-[430/232]",
} as const

const IMAGE_SIZES = {
  default: "(min-width: 1280px) 191px, (min-width: 640px) 33vw, 50vw",
  wide: "(min-width: 1280px) 430px, (min-width: 640px) 66vw, 100vw",
} as const

/**
 * The image and the text under it form one link, so the product has a single
 * tab stop. The add-to-bag button sits outside that link.
 */
export function ProductCard({ product, eager = false }: ProductCardProps) {
  const { image, tile } = product

  return (
    <article className="flex h-full flex-col">
      <Link
        href={getShopProductRoute(product.id)}
        className="flex flex-1 flex-col rounded-store-lg outline-none focus-visible:ring-3 focus-visible:ring-store-ink/40"
      >
        <div
          className={cn(
            "relative flex-1 overflow-hidden rounded-store-lg bg-white",
            TILE_ASPECT[tile]
          )}
        >
          {/* The picture is a tile-sized canvas with its own margin, so it is
              inset by the tile's 8px padding and contained, never cropped. */}
          <div className="absolute inset-2">
            <Image
              src={image.src}
              fill
              alt={image.alt}
              sizes={IMAGE_SIZES[tile]}
              loading={eager ? "eager" : "lazy"}
              className="object-contain"
            />
          </div>
        </div>
        <h2 className="mt-3 px-2 text-base leading-6 font-medium md:mt-3.5 md:text-xl md:leading-7">
          {product.name}
        </h2>
        <p className="mt-1 px-2 text-sm leading-5 text-store-muted md:text-[15.5px] md:leading-6">
          {product.subtitle}
        </p>
      </Link>
      <div className="mt-3 flex items-center justify-between px-2 md:mt-3.25 md:px-4">
        <p className="text-base font-medium md:text-xl">
          {formatStorefrontPrice(product.price)}
        </p>
        <AddToBagButton product={product} />
      </div>
    </article>
  )
}
