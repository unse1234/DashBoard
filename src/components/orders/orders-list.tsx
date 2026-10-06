"use client"

import { useState } from "react"

import { OrdersTable } from "@/components/orders/orders-table"
import { OrdersTableToolbar } from "@/components/orders/orders-table-toolbar"
import { TablePagination } from "@/components/shared/table-pagination"
import { defaultOrdersQuery, queryOrders } from "@/lib/orders/order.query"
import type { Order, OrdersQuery } from "@/lib/orders/order.types"
import { getNextSort } from "@/lib/sort"

type OrdersListProps = {
  /** Every order; there is no API to ask for one page at a time yet. */
  orders: Order[]
}

/**
 * Owns the list controls' state. Until the API exists it also searches,
 * filters, sorts and pages `orders` with `queryOrders`. With the API, `query`
 * is what gets sent to it (or written to the URL) and the rows and
 * `totalRecords` come back for that query.
 */
export function OrdersList({ orders }: OrdersListProps) {
  const [query, setQuery] = useState<OrdersQuery>(defaultOrdersQuery)
  const { orders: rows, totalRecords, page } = queryOrders(orders, query)

  // Anything that changes which orders are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<OrdersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(nextPage: number) {
    setQuery((current) => ({ ...current, page: nextPage }))
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
        orders={rows}
        sort={query.sort}
        onSortChange={(column) =>
          updateQuery({ sort: getNextSort(query.sort, column) })
        }
      />
      <TablePagination
        resourceName="orders"
        page={page}
        pageSize={query.pageSize}
        totalRecords={totalRecords}
        onPageChange={goToPage}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
      />
    </div>
  )
}
