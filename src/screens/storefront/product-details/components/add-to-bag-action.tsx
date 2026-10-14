"use client"

import { BagPlusIcon } from "@/components/storefront/storefront-icons"
import { Button } from "@/components/ui/button"
import { useBag } from "@/hooks/storefront/use-bag"
import type { StorefrontProduct } from "@/types/storefront/product.types"

type AddToBagActionProps = {
  product: StorefrontProduct
}

/**
 * The labelled counterpart of the catalog's icon-only add-to-bag button. The
 * bag's live region announces what was added, so nothing else needs to speak.
 * A sold-out product shows the same button, switched off; the product's
 * information says why.
 */
export function AddToBagAction({ product }: AddToBagActionProps) {
  const { addProduct } = useBag()

  return (
    <Button
      type="button"
      disabled={!product.inStock}
      onClick={() => addProduct(product)}
      className="h-12 w-full gap-2 rounded-store-sm border-0 bg-store-ink px-6 text-xl font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40 @sm:w-auto @xl:h-10"
    >
      <BagPlusIcon className="size-6" />
      Add to Bag
    </Button>
  )
}
