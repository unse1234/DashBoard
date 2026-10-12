import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatInteger } from "@/utils/format-number"
import type { Product } from "@/types/product.types"

type ProductInventoryProps = {
  product: Product
}

export function ProductInventory({ product }: ProductInventoryProps) {
  const isInStock = product.stock > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Inventory</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-5">
          <DetailItem label="Stock Quantity">
            {formatInteger(product.stock)}
          </DetailItem>
          <DetailItem label="Availability">
            {isInStock ? (
              "In stock"
            ) : (
              <span className="text-destructive">Out of stock</span>
            )}
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
