"use client"

import { LoadError } from "@/components/shared/load-error"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api/api-error"
import { useProductQuery } from "@/lib/products/product.queries"
import { ProductDetailsHeader } from "@/screens/products/details/components/product-details-header"
import { ProductDetailsTabs } from "@/screens/products/details/components/product-details-tabs"
import { ProductNotFound } from "@/screens/products/details/components/product-not-found"

type ProductDetailsProps = {
  productId: string
}

/** Loads one product and renders the matching state: loading, missing, failed or ready. */
export function ProductDetails({ productId }: ProductDetailsProps) {
  const { data: product, error, refetch } = useProductQuery(productId)

  if (error) {
    // The API answers 404 for unknown and archived ids, and 400 for ids not
    // shaped like "PRD-1001".
    if (isApiError(error) && (error.status === 404 || error.status === 400)) {
      return <ProductNotFound />
    }
    return (
      <LoadError
        resourceName="this product"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!product) return <ProductDetailsSkeleton />

  return (
    <>
      <ProductDetailsHeader product={product} />
      <ProductDetailsTabs product={product} />
    </>
  )
}

/** The page's outline (header, tabs, two cards) while it loads. */
function ProductDetailsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  )
}
