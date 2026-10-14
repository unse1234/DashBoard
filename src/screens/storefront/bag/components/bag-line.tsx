"use client"

import { ProductImage } from "@/components/storefront/product-image"
import { useBag } from "@/hooks/storefront/use-bag"
import { QuantityStepper } from "@/screens/storefront/bag/components/quantity-stepper"
import type { BagItem } from "@/types/storefront/bag.types"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"
import { getProductLabel } from "@/utils/storefront/product-label"

type BagLineProps = {
  item: BagItem
  /** For lines above the fold: loads the picture without waiting to scroll. */
  eager?: boolean
}

export function BagLine({ item, eager = false }: BagLineProps) {
  const { changeQuantity } = useBag()
  const { product, quantity } = item
  const label = getProductLabel(product)

  return (
    <article className="flex flex-col gap-4 rounded-store-lg bg-white p-2 sm:min-h-72 sm:flex-row">
      <div className="relative h-52 w-full sm:h-auto sm:w-59 sm:shrink-0">
        <ProductImage
          image={product.image}
          sizes="(min-width: 640px) 236px, 100vw"
          eager={eager}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2 pb-4 sm:px-0 sm:py-3.75">
        <h2 className="text-2xl leading-8 font-normal md:text-[31px] md:leading-10">
          {product.name}
        </h2>
        {product.subtitle && (
          <p className="mt-1 text-xl leading-7 text-store-muted">
            {product.subtitle}
          </p>
        )}
        {product.description && (
          <p className="mt-3.25 line-clamp-3 text-base leading-7 md:text-[19px]">
            {product.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-4 sm:mt-auto sm:pt-7.25">
          <p className="flex items-baseline gap-2.5 pl-2 text-xl leading-7 whitespace-nowrap">
            <span className="font-medium">
              {formatStorefrontPrice(product.price, product.currency)}
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
