"use client"

import { useEffect } from "react"
import Link from "next/link"

import { StorefrontLoadError } from "@/components/storefront/storefront-load-error"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/config/routes"
import { useBag } from "@/hooks/storefront/use-bag"
import { BagLine } from "@/screens/storefront/bag/components/bag-line"
import { cn } from "@/utils/cn"

// Lines above the fold: their pictures load without waiting to scroll.
const EAGER_IMAGE_COUNT = 2

export function BagItems() {
  const { items, hasIssues, isRestoring, loadError, refresh } = useBag()

  // Prices and stock move: price the bag again whenever it is opened, so what
  // is shown is the server's current answer and not the one from the last click.
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    // From xl the column is the design's 877px, set 10px right of centre.
    <div className="mx-auto w-full max-w-228 xl:pr-1.5 xl:pl-6.5">
      <h1 className="px-2 text-3xl leading-10 font-normal md:pt-6.25 md:text-[49px] md:leading-14">
        Check your Bag Items
      </h1>

      {hasIssues && (
        <p
          role="status"
          className="mt-4 rounded-store-md bg-white p-4 text-base leading-6"
        >
          Some items in your bag can’t be bought as they are. Remove them or
          lower their quantity to continue to checkout.
        </p>
      )}

      {items.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4 md:mt-9 md:gap-6">
          {items.map((item, index) => (
            <li key={item.productId}>
              <BagLine item={item} eager={index < EAGER_IMAGE_COUNT} />
            </li>
          ))}
        </ul>
      ) : loadError ? (
        <StorefrontLoadError
          resourceName="your bag"
          error={loadError}
          onRetry={refresh}
        />
      ) : isRestoring ? (
        <p role="status" className="mt-16 text-center text-xl font-medium">
          Loading your bag…
        </p>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-medium">Your bag is empty.</p>
          <p className="text-base text-store-muted">
            Add something from the shop and it will appear here.
          </p>
          <Link
            href={routes.shop}
            className={cn(
              buttonVariants(),
              "mt-2 h-11 rounded-store-sm border-0 bg-store-ink px-6 text-base font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"
            )}
          >
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  )
}
