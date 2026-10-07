import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getMockProductById } from "@/lib/products/product.mock-data"
import { EditProductScreen } from "@/screens/products/edit"

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

  return <EditProductScreen product={product} />
}
