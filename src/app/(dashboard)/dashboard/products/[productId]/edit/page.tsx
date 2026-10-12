import type { Metadata } from "next"

import { EditProductScreen } from "@/screens/products/edit"

// The product is loaded in the browser (the API needs the signed-in token), so
// the title cannot include its name.
export const metadata: Metadata = {
  title: "Edit product",
}

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/products/[productId]/edit">) {
  const { productId } = await params

  return <EditProductScreen productId={productId} />
}
