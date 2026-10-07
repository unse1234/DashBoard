import Link from "next/link"
import { PencilIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import type { Product } from "@/lib/products/product.types"
import { getProductDisplayStatus } from "@/lib/products/product.utils"
import { getEditProductRoute } from "@/lib/routes"
import { ProductStatusBadge } from "@/screens/products/components/product-status-badge"

type ProductDetailsHeaderProps = {
  product: Product
}

export function ProductDetailsHeader({ product }: ProductDetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-xl font-medium wrap-anywhere">{product.name}</h2>
          <ProductStatusBadge status={getProductDisplayStatus(product)} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
      </div>
      <Link
        href={getEditProductRoute(product.id)}
        className={buttonVariants({ className: "w-fit shrink-0" })}
      >
        <PencilIcon aria-hidden="true" />
        Edit
      </Link>
    </div>
  )
}
