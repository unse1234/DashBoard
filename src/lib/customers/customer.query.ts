import type { CustomersQuery } from "@/lib/customers/customer.types"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

export const defaultCustomersQuery: CustomersQuery = {
  search: "",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
