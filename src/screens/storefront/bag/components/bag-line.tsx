"use client"

import Image from "next/image"

import { useBag } from "@/hooks/storefront/use-bag"
import { demoBagLineBlurb } from "@/mocks/storefront/bag"
import { QuantityStepper } from "@/screens/storefront/bag/components/quantity-stepper"
import { ProductRating } from "@/screens/storefront/product-details/components/product-rating"
import { getProductDetails } from "@/screens/storefront/product-details/product-details.mocks"
import type { BagItem } from "@/types/storefront/bag.types"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

// The design's score, for products the item view has no rating for.
const DEFAULT_RATING = 4.5

type BagLineProps = {
  item: BagItem
  /** For lines above the fold: loads the picture without waiting to scroll. */
  eager?: boolean
}

export function BagLine({ item, eager = false }: BagLineProps) {
  const { changeQuantity } = useBag()
  const { product, quantity } = item
  const label = `${product.name}, ${product.subtitle}`
  const rating = getProductDetails(product.id)?.rating ?? DEFAULT_RATING

  return (
    <article className="flex flex-col gap-4 rounded-store-lg bg-white p-2 sm:min-h-72 sm:flex-row">
      <div className="relative h-52 w-full sm:h-auto sm:w-59 sm:shrink-0">
        <Image
          src={product.image.src}
          fill
          alt={product.image.alt}
          sizes="(min-width: 640px) 236px, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-contain"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2 pb-4 sm:px-0 sm:py-3.75">
        <h2 className="text-2xl leading-8 font-normal md:text-[31px] md:leading-10">
          {product.name}
        </h2>
        <p className="mt-1 text-xl leading-7 text-store-muted">
          {product.subtitle}
        </p>
        <p className="mt-3.25 text-base leading-7 md:text-[19px]">
          {demoBagLineBlurb}
        </p>
        <ProductRating rating={rating} className="mt-5.5" />

        <div className="mt-5 flex items-center justify-between gap-4 sm:mt-7.25">
          <p className="flex items-baseline gap-2.5 pl-2 text-xl leading-7 whitespace-nowrap">
            <span className="font-medium">
              {formatStorefrontPrice(product.price)}
            </span>
            <span aria-hidden="true">x</span>
            <span className="sr-only">times</span>
            <span>{quantity}</span>
          </p>
          {/* From xl a fixed slot, so the minus stays put while the quantity's
              width changes, as in the design; below that it sits at the edge. */}
          <div className="xl:mr-7.5 xl:w-31">
            <QuantityStepper
              label={label}
              quantity={quantity}
              onDecrease={() => changeQuantity(product.id, -1)}
              onIncrease={() => changeQuantity(product.id, 1)}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
