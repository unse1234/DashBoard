import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/utils/format-date"
import type { Product } from "@/types/product.types"
import { getProductDisplayStatus } from "@/utils/product.utils"
import { ProductStatusBadge } from "@/screens/products/components/product-status-badge"
import { ProductImage } from "@/components/storefront/product-image"

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
          <DetailItem label="Subtitle" className="@lg:col-span-2">
            {product.subtitle ?? (
              <span className="text-muted-foreground">Not set</span>
            )}
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
          <DetailItem label="Shop Images" className="@lg:col-span-2">
            {product.imageUrl === null && product.galleryUrls.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[product.imageUrl, ...product.galleryUrls]
                  .filter((url): url is string => url !== null)
                  .map((url, index) => (
                    <li key={`${index}-${url}`} className="break-all">
                      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                        <ProductImage image={{ url, alt: `${product.name}, image ${index + 1}` }} sizes="(max-width: 640px) 40vw, 180px" />
                      </div>
                      <span className="text-xs text-muted-foreground">{index === 0 ? "Cover" : `Image ${index + 1}`}</span>
                    </li>
                  ))}
              </ol>
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
