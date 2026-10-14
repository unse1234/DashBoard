import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/utils/format-number"
import type { Product } from "@/types/product.types"

type ProductPricingProps = {
  product: Product
}

export function ProductPricing({ product }: ProductPricingProps) {
  // Worked out by the API, so every screen and the data agree on it.
  const { margin } = product

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Pricing</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-5">
          <DetailItem label="Selling Price">
            {formatCurrency(product.price, product.currency)}
          </DetailItem>
          <DetailItem label="Cost Price">
            {product.costPrice === null ? (
              <span className="text-muted-foreground">Not set</span>
            ) : (
              formatCurrency(product.costPrice, product.currency)
            )}
          </DetailItem>
          <DetailItem label="Margin">
            {margin === null ? (
              <span className="text-muted-foreground">Not available</span>
            ) : (
              formatPercent(margin)
            )}
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
