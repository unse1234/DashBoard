import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ProductForm } from "@/components/products/product-form"
import { BackLink } from "@/components/shared/back-link"
import { getMockProductById } from "@/lib/products/product.mock-data"
import { getProductRoute } from "@/lib/routes"

type EditProductPageProps = PageProps<"/dashboard/products/[productId]/edit">

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { productId } = await params
  const product = getMockProductById(productId)

  return { title: product ? `Edit ${product.name}` : "Product not found" }
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { productId } = await params
  const product = getMockProductById(productId)

  if (!product) notFound()

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
