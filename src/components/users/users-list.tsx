"use client"

import { useState } from "react"

import { TablePagination } from "@/components/shared/table-pagination"
import { UsersTable } from "@/components/users/users-table"
import { UsersTableToolbar } from "@/components/users/users-table-toolbar"
import { defaultUsersQuery, getNextSort } from "@/lib/users/user.query"
import type { User, UsersQuery } from "@/lib/users/user.types"

type UsersListProps = {
  /** The rows for the current query, as the server would return them. */
  users: User[]
  totalRecords: number
}

/**
 * Owns the list controls' state. It does not search, filter, sort or page
 * `users` itself: once the API exists, `query` is what gets sent to it (or
 * written to the URL) and `users` / `totalRecords` come back for that query.
 */
export function UsersList({ users, totalRecords }: UsersListProps) {
  const [query, setQuery] = useState<UsersQuery>(defaultUsersQuery)

  // Anything that changes which users are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<UsersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(page: number) {
    setQuery((current) => ({ ...current, page }))
  }

  return (
    <div className="flex flex-col gap-4">
      <UsersTableToolbar
        search={query.search}
        status={query.status}
        onSearchChange={(search) => updateQuery({ search })}
        onStatusChange={(status) => updateQuery({ status })}
      />
      <UsersTable
        users={users}
        sort={query.sort}
        onSortChange={(column) =>
          updateQuery({ sort: getNextSort(query.sort, column) })
        }
      />
      <TablePagination
        resourceName="users"
        page={query.page}
        pageSize={query.pageSize}
        totalRecords={totalRecords}
        onPageChange={goToPage}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
      />
    </div>
  )
}
