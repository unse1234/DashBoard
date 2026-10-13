import type { Metadata } from "next"

import { ProductDetailsScreen } from "@/screens/storefront/product-details"

export const metadata: Metadata = {
  title: "Product details",
}

export default async function ShopProductPage({
  params,
}: PageProps<"/shop/[productId]">) {
  const { productId } = await params

  return <ProductDetailsScreen productId={productId} />
}
