import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getMockOrderById } from "@/lib/orders/order.mock-data"
import { OrderDetailsScreen } from "@/screens/orders/details"

type OrderDetailsPageProps = PageProps<"/dashboard/orders/[orderId]">

export async function generateMetadata({
  params,
}: OrderDetailsPageProps): Promise<Metadata> {
  const { orderId } = await params
  const order = getMockOrderById(orderId)

  return { title: order ? `Order ${order.id}` : "Order not found" }
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { orderId } = await params
  const order = getMockOrderById(orderId)

  if (!order) notFound()

  return <OrderDetailsScreen order={order} />
}
