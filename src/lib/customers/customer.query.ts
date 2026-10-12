import type { CustomersQuery } from "@/types/customer.types"
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination.constants";

export const defaultCustomersQuery: CustomersQuery = {
  search: "",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
