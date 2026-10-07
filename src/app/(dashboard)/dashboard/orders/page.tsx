import type { Metadata } from "next"

import { mockOrders, mockTotalOrders } from "@/lib/orders/order.mock-data"
import { OrdersScreen } from "@/screens/orders"

export const metadata: Metadata = {
  title: "Orders",
}

export default function OrdersPage() {
  return <OrdersScreen orders={mockOrders} totalRecords={mockTotalOrders} />
}
