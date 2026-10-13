"use client"

import { BagPlusIcon } from "@/components/storefront/storefront-icons"
import { Button } from "@/components/ui/button"
import { useBag } from "@/hooks/storefront/use-bag"
import type { StorefrontProduct } from "@/types/storefront/product.types"

type AddToBagButtonProps = {
  product: StorefrontProduct
}

export function AddToBagButton({ product }: AddToBagButtonProps) {
  const { addProduct } = useBag()

  return (
    <Button
      type="button"
      size="icon"
      aria-label={`Add ${product.name}, ${product.subtitle}, to bag`}
      className="size-11 rounded-store-xs border-0 bg-store-ink text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40 md:size-8.5"
      onClick={() => addProduct(product)}
    >
      <BagPlusIcon className="size-5" />
    </Button>
  )
}
