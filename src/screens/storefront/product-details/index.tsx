"use client"

import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { StorefrontLoadError } from "@/components/storefront/storefront-load-error"
import { useStorefrontProductQuery } from "@/hooks/storefront/catalog.queries"
import { isApiError } from "@/lib/api/api-error"
import { ProductNotFound } from "@/screens/storefront/product-details/components/product-not-found"
import { ProductView } from "@/screens/storefront/product-details/components/product-view"
import { ShopBackLink } from "@/screens/storefront/product-details/components/shop-back-link"

type ProductDetailsScreenProps = {
  productId: string
}

export function ProductDetailsScreen({ productId }: ProductDetailsScreenProps) {
  const {
    data: product,
    isPending,
    isError,
    error,
    refetch,
  } = useStorefrontProductQuery(productId)

  // The API answers 404 for an id that is unknown, malformed, switched off or
  // not for sale here alike, so the shopper is told the same thing for all.
  if (isError && isApiError(error) && error.status === 404) {
    return <ProductNotFound />
  }

  return (
    <StorefrontShell>
      {/* Container queries rather than viewport breakpoints: the shell hands this
          column a different width at each step, and the layout follows that. */}
      <div className="@container mx-auto w-full max-w-220 pt-4">
        <ShopBackLink>Back</ShopBackLink>

        {isPending ? (
          <>
            <p role="status" className="sr-only">
              Loading product
            </p>
            <div
              aria-hidden="true"
              className="mt-6 flex animate-pulse flex-col gap-6 @xl:flex-row"
            >
              <div className="aspect-4/3 w-full rounded-store-md bg-white @xl:h-79.5 @xl:w-64.5 @xl:shrink-0" />
              <div className="flex flex-1 flex-col gap-4">
                <div className="h-10 w-3/4 rounded-store-xs bg-white" />
                <div className="h-8 w-1/2 rounded-store-xs bg-white" />
                <div className="h-10 w-1/3 rounded-store-xs bg-white" />
              </div>
            </div>
          </>
        ) : isError ? (
          <StorefrontLoadError
            resourceName="this product"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : (
          <ProductView product={product} />
        )}
      </div>
    </StorefrontShell>
  )
}
