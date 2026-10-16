"use client"

import { useState } from "react"

import { ProductImage } from "@/components/storefront/product-image"
import type { StorefrontProductImage } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"

type ProductGalleryProps = {
  /** The product's pictures in display order; may be empty. */
  images: StorefrontProductImage[]
}

/**
 * The chosen picture in a white panel, with one thumbnail button per picture
 * when there is more than one to choose from. The thumbnails sit in a column
 * beside the panel and in a row beneath it on a phone. The panel comes first
 * in the source so a screen reader hears what is shown before the choices.
 *
 * Next to the product information the panel is the design's 258 × 318. When the
 * column is too narrow for that, the gallery takes the whole row and the panel
 * stretches to fill it, so no strip of empty space is left beside it.
 */
export function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const selectedIndex = Math.max(0, images.findIndex((image) => image.url === selectedUrl))
  const selected = images[selectedIndex] ?? null

  return (
    <div className="flex flex-col gap-4 @md:flex-row-reverse @md:items-start @xl:w-fit @xl:shrink-0">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-store-md bg-white @md:aspect-auto @md:h-79.5 @md:min-w-0 @md:flex-1 @xl:w-64.5 @xl:flex-none">
        <ProductImage
          image={selected}
          sizes="(min-width: 576px) 258px, (min-width: 448px) 75vw, 100vw"
          eager
        />
        {!selected && <span className="sr-only">No image available</span>}
      </div>

      {/* One picture needs no chooser. */}
      {images.length > 1 && (
        <ul aria-label="Product images" className="flex max-w-full flex-wrap gap-4 @md:flex-col">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedUrl(image.url)}
                className={cn(
                  "relative block h-14.5 w-12.5 overflow-hidden rounded-store-sm bg-white outline-hidden focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-store-ink/40",
                  index === selectedIndex && "ring-2 ring-store-ink"
                )}
              >
                {/* The button's label names the picture, so the image is decorative. */}
                <ProductImage image={image} sizes="50px" eager decorative />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
