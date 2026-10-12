import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"
import { ProductDetails } from "@/screens/products/details/components/product-details"

type ProductDetailsScreenProps = {
  productId: string
}

export function ProductDetailsScreen({ productId }: ProductDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Product details" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <ProductDetails productId={productId} />
      </PageContent>
    </>
  )
}
