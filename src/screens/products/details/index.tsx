import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import type {
  Product,
  ProductHistoryEntry,
} from "@/lib/products/product.types"
import { routes } from "@/lib/routes"
import { ProductDetailsHeader } from "@/screens/products/details/components/product-details-header"
import { ProductDetailsTabs } from "@/screens/products/details/components/product-details-tabs"

type ProductDetailsScreenProps = {
  product: Product
  history: ProductHistoryEntry[]
}

export function ProductDetailsScreen({
  product,
  history,
}: ProductDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Product details" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <ProductDetailsHeader product={product} />
        <ProductDetailsTabs product={product} history={history} />
      </PageContent>
    </>
  )
}
