import { ProductStatusBadge } from "@/components/products/product-status-badge"
import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import type { Product } from "@/lib/products/product.types"
import { getProductDisplayStatus } from "@/lib/products/product.utils"

type ProductInformationProps = {
  product: Product
}

export function ProductInformation({ product }: ProductInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Product information</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container">
        <dl className="grid gap-x-6 gap-y-5 @lg:grid-cols-2">
          <DetailItem label="Product Name" className="@lg:col-span-2">
            {product.name}
          </DetailItem>
          <DetailItem label="SKU">
            <span className="font-mono text-xs">{product.sku}</span>
          </DetailItem>
          <DetailItem label="Category">{product.category}</DetailItem>
          <DetailItem label="Brand">
            {product.brand ?? (
              <span className="text-muted-foreground">Not set</span>
            )}
          </DetailItem>
          <DetailItem label="Status">
            <ProductStatusBadge status={getProductDisplayStatus(product)} />
          </DetailItem>
          <DetailItem label="Description" className="@lg:col-span-2">
            {product.description ?? (
              <span className="text-muted-foreground">Not set</span>
            )}
          </DetailItem>
          <DetailItem label="Created At">
            <time dateTime={product.createdAt}>
              {formatDateTime(product.createdAt)}
            </time>
          </DetailItem>
          <DetailItem label="Last Updated">
            <time dateTime={product.updatedAt}>
              {formatDateTime(product.updatedAt)}
            </time>
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
