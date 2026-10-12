"use client"

import { LoadError } from "@/components/shared/load-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductHistoryQuery } from "@/lib/products/product.queries"
import { ProductHistory } from "@/screens/products/details/components/product-history"

const PLACEHOLDER_ROW_COUNT = 3

type ProductHistoryTabProps = {
  productId: string
}

/**
 * The history is requested when its tab is opened (the tab's content is not
 * mounted before that), not with the product itself.
 */
export function ProductHistoryTab({ productId }: ProductHistoryTabProps) {
  const { data, error, refetch } = useProductHistoryQuery(productId)

  if (error) {
    return (
      <LoadError
        resourceName="the history"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle>
            <h3>Edit history</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return <ProductHistory entries={data} />
}
