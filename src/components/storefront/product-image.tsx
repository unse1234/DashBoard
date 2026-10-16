"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOffIcon } from "lucide-react"

import type { StorefrontProductImage } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"

type ProductImageProps = {
  /** Null when the product has no picture: a placeholder is drawn instead. */
  image: StorefrontProductImage | null
  /** The `sizes` attribute: how wide the picture is at each viewport width. */
  sizes: string
  /** For pictures above the fold: loads without waiting to scroll. */
  eager?: boolean
  /**
   * The surrounding text or label already names the product, so the picture
   * adds nothing for a screen reader.
   */
  decorative?: boolean
  className?: string
}

// An address on another origin. The API accepts those as well as paths of this
// site, and the host is not known ahead of time, so it cannot be listed in
// next.config's `images.remotePatterns`. It is shown as it is, unresized.
const isAbsoluteUrl = (url: string) => /^(https?:\/\/|blob:)/i.test(url)

/**
 * A product picture that fills its (relatively positioned) parent. The API
 * stores no dimensions, so the parent's box decides the proportions: the
 * picture covers the whole box, centred, and whatever does not fit that shape
 * is cropped, so no frame is ever left with empty bands.
 */
export function ProductImage({
  image,
  sizes,
  eager = false,
  decorative = false,
  className,
}: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (!image || failedUrl === image.url) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex items-center justify-center text-store-placeholder",
          className
        )}
      >
        <ImageOffIcon className="size-1/4 min-h-6 min-w-6" strokeWidth={1.5} />
      </span>
    )
  }

  return (
    <Image
      src={image.url}
      fill
      alt={decorative ? "" : image.alt}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      unoptimized={isAbsoluteUrl(image.url)}
      onError={() => setFailedUrl(image.url)}
      className={cn("object-cover", className)}
    />
  )
}
