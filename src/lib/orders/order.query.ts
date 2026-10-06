import type { OrdersQuery } from "@/lib/orders/order.types"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

export const defaultOrdersQuery: OrdersQuery = {
  search: "",
  status: "all",
  paymentStatus: "all",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
