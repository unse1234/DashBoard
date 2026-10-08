"use client"

import { useState } from "react"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { TablePagination } from "@/components/shared/table-pagination"
import { useApiResource } from "@/hooks/use-api-resource"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { inviteUser, listUsers } from "@/lib/users/user.api"
import { defaultUsersQuery } from "@/lib/users/user.query"
import type { CreateUserValues } from "@/lib/users/user.schemas"
import type { UsersQuery } from "@/lib/users/user.types"
import { CreateUserDialog } from "@/screens/users/components/create-user-dialog"
import { UsersTable } from "@/screens/users/components/users-table"
import { UsersTableToolbar } from "@/screens/users/components/users-table-toolbar"

const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the list controls' state and loads the matching page from the API. The
 * search text is sent only once the user pauses typing.
 */
export function UsersList() {
  const [query, setQuery] = useState<UsersQuery>(defaultUsersQuery)
  const search = useDebouncedValue(query.search, SEARCH_DEBOUNCE_MS)
  const request: UsersQuery = { ...query, search }

  const { data, error, isLoading, reload } = useApiResource(
    JSON.stringify(request),
    (signal) => listUsers(request, signal)
  )

  // Anything that changes which users are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<UsersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(page: number) {
    setQuery((current) => ({ ...current, page }))
  }

  async function handleCreate(values: CreateUserValues) {
    const { user, invitationSent } = await inviteUser(values)

    if (invitationSent) {
      toast.success(`Invitation sent to ${user.email}.`)
    } else {
      toast.warning(
        `${user.email} was created, but the invitation email could not be sent. They can request a link with "Forgot password".`
      )
    }
    reload()
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Manage the people who can access the dashboard.
        </p>
        <CreateUserDialog onSubmit={handleCreate} />
      </div>
      <div className="flex flex-col gap-4">
        <UsersTableToolbar
          search={query.search}
          status={query.status}
          onSearchChange={(next) => updateQuery({ search: next })}
          onStatusChange={(status) => updateQuery({ status })}
        />
        {error ? (
          <LoadError resourceName="users" error={error} onRetry={reload} />
        ) : (
          <>
            <UsersTable
              users={data?.users ?? []}
              isLoading={isLoading}
              onUserChanged={reload}
            />
            <TablePagination
              resourceName="users"
              page={query.page}
              pageSize={query.pageSize}
              totalRecords={data?.totalRecords ?? 0}
              onPageChange={goToPage}
              onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
            />
          </>
        )}
      </div>
    </div>
  )
}
