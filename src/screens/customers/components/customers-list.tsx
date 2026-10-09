"use client"

import { useState } from "react"

import { LoadError } from "@/components/shared/load-error"
import { TablePagination } from "@/components/shared/table-pagination"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useCustomersQuery } from "@/lib/customers/customer.queries"
import { defaultCustomersQuery } from "@/lib/customers/customer.query"
import type { CustomersQuery } from "@/lib/customers/customer.types"
import { getTotalPages } from "@/lib/pagination"
import { getNextSort } from "@/lib/sort"
import { CustomersTable } from "@/screens/customers/components/customers-table"
import { CustomersTableToolbar } from "@/screens/customers/components/customers-table-toolbar"

const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the list controls' state and shows the matching page. Searching, sorting
 * and paging all happen in the API; the search text is sent only once the user
 * pauses typing.
 */
export function CustomersList() {
  const [query, setQuery] = useState<CustomersQuery>(defaultCustomersQuery)
  const search = useDebouncedValue(query.search, SEARCH_DEBOUNCE_MS)
  const { data, error, isFetching, isPlaceholderData, refetch } =
    useCustomersQuery({ ...query, search })

  const totalRecords = data?.totalRecords ?? 0
  const lastPage = getTotalPages(totalRecords, query.pageSize)

  // If the list shrinks while a later page is open (customers are added and
  // removed outside the dashboard), step back to the last page that exists.
  // Adjusting state while rendering (rather than in an effect) avoids a frame of
  // the empty page. Only fresh data counts: placeholder data is the previous
  // page's, with the previous page's total.
  if (data && !isPlaceholderData && query.page > lastPage) {
    setQuery((current) => ({ ...current, page: lastPage }))
  }

  // Anything that changes which customers are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<CustomersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(page: number) {
    setQuery((current) => ({ ...current, page }))
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomersTableToolbar
        search={query.search}
        onSearchChange={(next) => updateQuery({ search: next })}
      />
      {error ? (
        <LoadError
          resourceName="customers"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <CustomersTable
            customers={data?.customers ?? []}
            isLoading={isFetching}
            sort={query.sort}
            onSortChange={(column) =>
              updateQuery({ sort: getNextSort(query.sort, column) })
            }
          />
          <TablePagination
            resourceName="customers"
            page={query.page}
            pageSize={query.pageSize}
            totalRecords={totalRecords}
            onPageChange={goToPage}
            onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
          />
        </>
      )}
    </div>
  )
}
