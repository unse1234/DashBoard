import type { PageSize } from "@/lib/pagination"

export type UserStatus = "active" | "inactive"

export type User = {
  /** Public identifier, also used in the details route. */
  uid: string
  name: string
  email: string
  status: UserStatus
  /** ISO 8601 timestamps; `lastLoginAt` is null until the first login. */
  createdAt: string
  lastLoginAt: string | null
}

export type UserStatusFilter = UserStatus | "all"

export type UserSortColumn = keyof User

export type SortDirection = "asc" | "desc"

export type UserSort = {
  column: UserSortColumn
  direction: SortDirection
}

/** Everything that decides which users are listed; maps 1:1 to future API or URL params. */
export type UsersQuery = {
  search: string
  status: UserStatusFilter
  sort: UserSort | null
  page: number
  pageSize: PageSize
}
