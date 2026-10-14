"use client"

import { ProductImage } from "@/components/storefront/product-image"
import { Button } from "@/components/ui/button"
import { useBag } from "@/hooks/storefront/use-bag"
import { QuantityStepper } from "@/screens/storefront/bag/components/quantity-stepper"
import type { BagLine as BagLineData } from "@/types/storefront/bag.types"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"
import { getProductLabel } from "@/utils/storefront/product-label"

type BagLineProps = {
  item: BagLineData
  /** For lines above the fold: loads the picture without waiting to scroll. */
  eager?: boolean
}

const ISSUE_MESSAGES = {
  PRODUCT_UNAVAILABLE: "This product is no longer available.",
  INSUFFICIENT_STOCK:
    "There is not enough stock for this quantity. Lower it, or remove the item.",
} as const

/**
 * One bag line, as the server priced it: the picture and facts of the product,
 * its unit price and quantity, and a stepper whose buttons are intents (the
 * server does the arithmetic). A line the server says cannot be bought shows why
 * and can still be lowered or removed.
 */
export function BagLine({ item, eager = false }: BagLineProps) {
  const { increase, decrease, remove } = useBag()
  const { product, productId, quantity, unitPrice, issue } = item

  return (
    <article className="flex flex-col gap-4 rounded-store-lg bg-white p-2 sm:min-h-72 sm:flex-row">
      <div className="relative h-52 w-full sm:h-auto sm:w-59 sm:shrink-0">
        <ProductImage
          image={product?.image ?? null}
          sizes="(min-width: 640px) 236px, 100vw"
          eager={eager}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2 pb-4 sm:px-0 sm:py-3.75">
        {product ? (
          <>
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
          </>
        ) : (
          // Nothing about a product that is not for sale is revealed, so there
          // is no name to show: only its id, and the way to take it out.
          <h2 className="text-2xl leading-8 font-normal md:text-[31px] md:leading-10">
            Unavailable product
            <span className="block text-xl leading-7 text-store-muted">
              {productId}
            </span>
          </h2>
        )}

        {issue && (
          <p
            role="status"
            className="mt-3 text-base font-medium text-store-danger"
          >
            {ISSUE_MESSAGES[issue]}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-4 sm:mt-auto sm:pt-7.25">
          {product && unitPrice !== null ? (
            <p className="flex items-baseline gap-2.5 pl-2 text-xl leading-7 whitespace-nowrap">
              <span className="font-medium">
                {formatStorefrontPrice(unitPrice, product.currency)}
              </span>
              <span aria-hidden="true">x</span>
              <span className="sr-only">times</span>
              <span>{quantity}</span>
            </p>
          ) : (
            <span />
          )}
          {product ? (
            /* From xl a fixed slot, so the minus stays put while the
               quantity's width changes, as in the design; below that it sits
               at the edge. */
            <div className="xl:mr-7.5 xl:w-31">
              <QuantityStepper
                label={getProductLabel(product)}
                quantity={quantity}
                onDecrease={() => decrease(productId)}
                onIncrease={() => increase(productId)}
              />
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => remove(productId)}
              className="h-10 rounded-store-sm border-0 bg-store-ink px-4 text-base font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"
            >
              Remove from bag
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
