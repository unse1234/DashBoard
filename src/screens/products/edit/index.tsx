import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { getProductRoute } from "@/config/routes"
import { EditProduct } from "@/screens/products/edit/components/edit-product"

type EditProductScreenProps = {
  productId: string
}

export function EditProductScreen({ productId }: EditProductScreenProps) {
  return (
    <>
      <DashboardHeader title="Edit product" />
      <PageContent narrow>
        <BackLink href={getProductRoute(productId)}>Back to Product</BackLink>
        <EditProduct productId={productId} />
      </PageContent>
    </>
  )
}
