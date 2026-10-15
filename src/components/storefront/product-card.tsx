import Link from "next/link"

import { AddToBagButton } from "@/components/storefront/add-to-bag-button"
import { ProductImage } from "@/components/storefront/product-image"
import { getShopProductRoute } from "@/config/routes"
import type { StorefrontProduct } from "@/types/storefront/product.types"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

type ProductCardProps = {
  product: StorefrontProduct
  /** For cards above the fold: loads the image without waiting to scroll. */
  eager?: boolean
}

/**
 * The image and the text under it form one link, so the product has a single
 * tab stop. The add-to-bag button sits outside that link.
 */
export function ProductCard({ product, eager = false }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col">
      <Link
        href={getShopProductRoute(product.id)}
        className="flex flex-1 flex-col rounded-store-lg outline-none focus-visible:ring-3 focus-visible:ring-store-ink/40"
      >
        {/* The design's 191 × 232 tile. It keeps that shape however much text
            the cards beside it carry; the text area takes up the difference,
            so the price rows still line up along the bottom of a grid row. */}
        <div className="relative aspect-191/232 overflow-hidden rounded-store-lg bg-white">
          {/* The picture covers the whole tile, edge to edge; the tile's
              rounded corners clip it. */}
          <ProductImage
            image={product.image}
            sizes="(min-width: 1280px) 191px, (min-width: 640px) 33vw, 50vw"
            eager={eager}
          />
        </div>
        <h2 className="mt-3 px-2 text-base leading-6 font-medium md:mt-3.5 md:text-xl md:leading-7">
          {product.name}
        </h2>
        {product.subtitle && (
          <p className="mt-1 px-2 text-sm leading-5 text-store-muted md:text-[15.5px] md:leading-6">
            {product.subtitle}
          </p>
        )}
        {!product.inStock && (
          <p className="mt-1 px-2 text-sm leading-5 font-medium text-store-danger md:text-[15.5px] md:leading-6">
            Sold out
          </p>
        )}
      </Link>
      <div className="mt-3 flex items-center justify-between px-2 md:mt-3.25 md:px-4">
        <p className="text-base font-medium md:text-xl">
          {formatStorefrontPrice(product.price, product.currency)}
        </p>
        <AddToBagButton product={product} />
      </div>
    </article>
  )
}
