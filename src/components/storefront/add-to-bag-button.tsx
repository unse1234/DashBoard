"use client"

import { BagPlusIcon } from "@/components/storefront/storefront-icons"
import { Button } from "@/components/ui/button"
import { useBag } from "@/hooks/storefront/use-bag"
import type { StorefrontProduct } from "@/types/storefront/product.types"
import { getProductLabel } from "@/utils/storefront/product-label"

type AddToBagButtonProps = {
  product: StorefrontProduct
}

export function AddToBagButton({ product }: AddToBagButtonProps) {
  const { addProduct } = useBag()
  const label = getProductLabel(product)

  return (
    <Button
      type="button"
      size="icon"
      // A sold-out product cannot be bought; the backend would refuse it, and
      // there is no point in offering it.
      disabled={!product.inStock}
      aria-label={
        product.inStock ? `Add ${label}, to bag` : `${label}, is sold out`
      }
      className="size-11 rounded-store-xs border-0 bg-store-ink text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40 md:size-8.5"
      onClick={() => addProduct(product)}
    >
      <BagPlusIcon className="size-5" />
    </Button>
  )
}
