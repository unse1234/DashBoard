"use client"

import { useState } from "react"

import { LoadError } from "@/components/shared/load-error"
import { TablePagination } from "@/components/shared/table-pagination"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useOrdersQuery } from "@/hooks/orders/order.queries"
import { defaultOrdersQuery } from "@/lib/orders/order.query"
import type { OrdersQuery } from "@/types/order.types"
import { getTotalPages } from "@/utils/pagination"
import { getNextSort } from "@/utils/sort"
import { OrdersTable } from "@/screens/orders/components/orders-table"
import { OrdersTableToolbar } from "@/screens/orders/components/orders-table-toolbar"

const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the list controls' state and shows the matching page. Searching,
 * filtering, sorting and paging all happen in the API; the search text is sent
 * only once the user pauses typing.
 */
export function OrdersList() {
  const [query, setQuery] = useState<OrdersQuery>(defaultOrdersQuery)
  const search = useDebouncedValue(query.search, SEARCH_DEBOUNCE_MS)
  const { data, error, isFetching, isPlaceholderData, refetch } =
    useOrdersQuery({ ...query, search })

  const totalRecords = data?.totalRecords ?? 0
  const lastPage = getTotalPages(totalRecords, query.pageSize)

  // If the list shrinks while a later page is open (orders are placed and
  // cancelled outside the dashboard too), step back to the last page that
  // exists. Adjusting state while rendering (rather than in an effect) avoids a
  // frame of the empty page. Only fresh data counts: placeholder data is the
  // previous page's, with the previous page's total.
  if (data && !isPlaceholderData && query.page > lastPage) {
    setQuery((current) => ({ ...current, page: lastPage }))
  }

  // Anything that changes which orders are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<OrdersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(page: number) {
    setQuery((current) => ({ ...current, page }))
  }

  return (
    <div className="flex flex-col gap-4">
      <OrdersTableToolbar
        search={query.search}
        status={query.status}
        paymentStatus={query.paymentStatus}
        onSearchChange={(next) => updateQuery({ search: next })}
        onStatusChange={(status) => updateQuery({ status })}
        onPaymentStatusChange={(paymentStatus) =>
          updateQuery({ paymentStatus })
        }
      />
      {error ? (
        <LoadError
          resourceName="orders"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <OrdersTable
            orders={data?.orders ?? []}
            isLoading={isFetching}
            sort={query.sort}
            onSortChange={(column) =>
              updateQuery({ sort: getNextSort(query.sort, column) })
            }
          />
          <TablePagination
            resourceName="orders"
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
