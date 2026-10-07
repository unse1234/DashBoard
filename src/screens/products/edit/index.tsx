import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import type { Product } from "@/lib/products/product.types"
import { getProductRoute } from "@/lib/routes"
import { ProductForm } from "@/screens/products/components/product-form"

type EditProductScreenProps = {
  product: Product
}

export function EditProductScreen({ product }: EditProductScreenProps) {
  return (
    <>
      <DashboardHeader title="Edit product" />
      <PageContent narrow>
        <BackLink href={getProductRoute(product.id)}>Back to Product</BackLink>
        <ProductForm product={product} />
      </PageContent>
    </>
  )
}
