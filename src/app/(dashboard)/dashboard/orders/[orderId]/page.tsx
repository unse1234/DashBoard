import type { Metadata } from "next"

import { OrderDetailsScreen } from "@/screens/orders/details"

// The order is loaded in the browser (the API needs the signed-in token), so
// the title cannot include its ID.
export const metadata: Metadata = {
  title: "Order details",
}

export default async function OrderDetailsPage({
  params,
}: PageProps<"/dashboard/orders/[orderId]">) {
  const { orderId } = await params

  return <OrderDetailsScreen orderId={orderId} />
}
