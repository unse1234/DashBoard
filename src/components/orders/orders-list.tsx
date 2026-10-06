"use client"

import { useState } from "react"

import { OrdersTable } from "@/components/orders/orders-table"
import { OrdersTableToolbar } from "@/components/orders/orders-table-toolbar"
import { TablePagination } from "@/components/shared/table-pagination"
import { defaultOrdersQuery } from "@/lib/orders/order.query"
import type { Order, OrdersQuery } from "@/lib/orders/order.types"
import { getNextSort } from "@/lib/sort"

type OrdersListProps = {
  /** The rows for the current query, as the server would return them. */
  orders: Order[]
  totalRecords: number
}

/**
 * Owns the list controls' state. It does not search, filter, sort or page
 * `orders` itself: once the API exists, `query` is what gets sent to it (or
 * written to the URL) and `orders` / `totalRecords` come back for that query.
 */
export function OrdersList({ orders, totalRecords }: OrdersListProps) {
  const [query, setQuery] = useState<OrdersQuery>(defaultOrdersQuery)

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
        onSearchChange={(search) => updateQuery({ search })}
        onStatusChange={(status) => updateQuery({ status })}
        onPaymentStatusChange={(paymentStatus) =>
          updateQuery({ paymentStatus })
        }
      />
      <OrdersTable
        orders={orders}
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
    </div>
  )
}
