import type { OrdersQuery } from "@/types/order.types"
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination.constants";

export const defaultOrdersQuery: OrdersQuery = {
  search: "",
  status: "all",
  paymentStatus: "all",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
