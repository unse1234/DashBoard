"use client"

import Link from "next/link"

import { ProductImage } from "@/components/storefront/product-image"
import { BagIcon } from "@/components/storefront/storefront-icons"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/config/routes"
import { useBag } from "@/hooks/storefront/use-bag"
import { cn } from "@/utils/cn"
import { formatStorefrontTotal } from "@/utils/storefront/format-price"
import { getProductLabel } from "@/utils/storefront/product-label"

export type BagPreviewAction = "view-bag" | "checkout"

type BagPreviewProps = {
  /** "view-bag" opens the bag screen; "checkout" shows the total and goes on to checkout. */
  action?: BagPreviewAction
}

const actionLinkClassName =
  "h-10 gap-2 rounded-store-sm border-0 bg-store-ink px-6 text-xl font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"

/** The bag beside the content from desktop width up; narrower screens use the navigation's bag link. */
export function BagPreview({ action = "view-bag" }: BagPreviewProps) {
  const { items, subtotal, currency, hasIssues, isRestoring } = useBag()
  const isEmpty = items.length === 0
  // Checkout waits for every line to be buyable, and for the bag to be known.
  const checkoutBlocked = isEmpty || hasIssues

  return (
    <aside
      aria-labelledby="bag-preview-heading"
      className="hidden lg:sticky lg:top-4 lg:flex lg:h-[calc(100svh-2rem)] lg:w-80 lg:shrink-0 lg:self-start xl:w-82.25"
    >
      <div
        aria-hidden="true"
        className="mt-8.75 mb-9 w-1 shrink-0 rounded-full bg-store-divider"
      />
      <div className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto pt-15.75 pr-5 pl-6 xl:pl-8">
        <h2
          id="bag-preview-heading"
          className="text-[40px] leading-12 font-normal"
        >
          Bag
        </h2>

        {!isEmpty ? (
          <ul className="mt-6.5 grid w-full grid-cols-3 gap-4">
            {items.map(({ productId, product, quantity }) => (
              <li
                key={productId}
                className="relative aspect-square overflow-hidden rounded-store-md bg-white"
              >
                {/* The product is named for a screen reader whether or not it
                    has a picture; the picture itself is decoration. */}
                <ProductImage
                  image={product?.image ?? null}
                  sizes="96px"
                  decorative
                />
                <span className="sr-only">
                  {product
                    ? getProductLabel(product)
                    : `Unavailable ${productId}`}
                  , quantity {quantity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-base text-store-muted">
            {isRestoring ? "Loading your bag…" : "Your bag is empty."}
          </p>
        )}

        {action === "checkout" && (
          <p className="mt-7.75 flex items-baseline gap-4 text-xl leading-7">
            <span>Bag Total:</span>
            <span className="font-medium">
              {formatStorefrontTotal(subtotal, currency)}
            </span>
          </p>
        )}

        {hasIssues && (
          <p className="mt-4 text-center text-base text-store-danger">
            Some items need your attention before you can check out.
          </p>
        )}

        {action === "checkout" && checkoutBlocked ? (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants(),
              actionLinkClassName,
              "mt-8.25 cursor-not-allowed opacity-50"
            )}
          >
            <BagIcon className="size-6" />
            Checkout
          </span>
        ) : (
          <Link
            href={action === "checkout" ? routes.checkout : routes.bag}
            className={cn(
              buttonVariants(),
              actionLinkClassName,
              action === "checkout" ? "mt-7.5" : "mt-8.25"
            )}
          >
            <BagIcon className="size-6" />
            {action === "checkout" ? "Checkout" : "View Bag"}
          </Link>
        )}
      </div>
    </aside>
  )
}
