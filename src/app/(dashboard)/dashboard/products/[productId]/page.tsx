import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ProductDetailsHeader } from "@/components/products/product-details-header"
import { ProductDetailsTabs } from "@/components/products/product-details-tabs"
import { BackLink } from "@/components/shared/back-link"
import {
  getMockProductById,
  getMockProductHistory,
} from "@/lib/products/product.mock-data"
import { routes } from "@/lib/routes"

type ProductDetailsPageProps = PageProps<"/dashboard/products/[productId]">

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { productId } = await params

  return { title: getMockProductById(productId)?.name ?? "Product not found" }
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { productId } = await params
  const product = getMockProductById(productId)

  if (!product) notFound()

  return (
    <>
      <DashboardHeader title="Product details" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <ProductDetailsHeader product={product} />
        <ProductDetailsTabs
          product={product}
          history={getMockProductHistory(product.id)}
        />
      </PageContent>
    </>
  )
}
