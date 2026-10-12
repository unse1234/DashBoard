import { DEFAULT_PAGE_SIZE } from "@/constants/pagination.constants";
import type { UsersQuery } from "@/types/user.types"

export const defaultUsersQuery: UsersQuery = {
  search: "",
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
