import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import type { UsersQuery } from "@/lib/users/user.types"

export const defaultUsersQuery: UsersQuery = {
  search: "",
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
