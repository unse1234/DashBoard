import type { Metadata } from "next"

import { ProductDetailsScreen } from "@/screens/products/details"

// The product is loaded in the browser (the API needs the signed-in token), so
// the title cannot include its name.
export const metadata: Metadata = {
  title: "Product details",
}

export default async function ProductDetailsPage({
  params,
}: PageProps<"/dashboard/products/[productId]">) {
  const { productId } = await params

  return <ProductDetailsScreen productId={productId} />
}
