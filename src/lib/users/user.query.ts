import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import type {
  UserSort,
  UserSortColumn,
  UsersQuery,
} from "@/lib/users/user.types"

export const defaultUsersQuery: UsersQuery = {
  search: "",
  status: "all",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

/** Unsorted → ascending → descending → unsorted; a new column starts ascending. */
export function getNextSort(
  current: UserSort | null,
  column: UserSortColumn
): UserSort | null {
  if (current?.column !== column) return { column, direction: "asc" }
  if (current.direction === "asc") return { column, direction: "desc" }
  return null
}
