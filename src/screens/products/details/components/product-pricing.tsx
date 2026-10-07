import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatPercent } from "@/lib/format-number"
import type { Product } from "@/lib/products/product.types"
import { getProductMargin } from "@/lib/products/product.utils"

type ProductPricingProps = {
  product: Product
}

export function ProductPricing({ product }: ProductPricingProps) {
  const margin = getProductMargin(product)

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
            {formatCurrency(product.price)}
          </DetailItem>
          <DetailItem label="Cost Price">
            {product.costPrice === null ? (
              <span className="text-muted-foreground">Not set</span>
            ) : (
              formatCurrency(product.costPrice)
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
