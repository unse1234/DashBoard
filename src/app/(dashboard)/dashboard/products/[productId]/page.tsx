import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getMockProductById,
  getMockProductHistory,
} from "@/lib/products/product.mock-data"
import { ProductDetailsScreen } from "@/screens/products/details"

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
    <ProductDetailsScreen
      product={product}
      history={getMockProductHistory(product.id)}
    />
  )
}
