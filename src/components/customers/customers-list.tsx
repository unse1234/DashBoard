"use client"

import { useState } from "react"
import { toast } from "sonner"

import { CustomersTable } from "@/components/customers/customers-table"
import { CustomersTableToolbar } from "@/components/customers/customers-table-toolbar"
import { TablePagination } from "@/components/shared/table-pagination"
import {
  defaultCustomersQuery,
  queryCustomers,
} from "@/lib/customers/customer.query"
import type {
  Customer,
  CustomersQuery,
  CustomerStatus,
} from "@/lib/customers/customer.types"
import { getStatusChangeMessage } from "@/lib/customers/customer.utils"
import { getNextSort } from "@/lib/sort"

type CustomersListProps = {
  /** Every customer; there is no API to ask for one page at a time yet. */
  customers: Customer[]
}

/**
 * Owns the list controls' state. Until the API exists it also searches,
 * filters, sorts and pages `customers` with `queryCustomers`, and Enable /
 * Disable only changes this list's own copy. With the API, `query` is what
 * gets sent to it (or written to the URL), `customers` / `totalRecords` come
 * back for that query, and a status change becomes a request.
 */
export function CustomersList({
  customers: initialCustomers,
}: CustomersListProps) {
  const [query, setQuery] = useState<CustomersQuery>(defaultCustomersQuery)
  const [customers, setCustomers] = useState(initialCustomers)
  const { customers: rows, totalRecords, page } = queryCustomers(customers, query)

  // Anything that changes which customers are listed starts again from page one.
  function updateQuery(changes: Partial<Omit<CustomersQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  function goToPage(nextPage: number) {
    setQuery((current) => ({ ...current, page: nextPage }))
  }

  function changeStatus(customer: Customer, status: CustomerStatus) {
    setCustomers((current) =>
      current.map((item) =>
        item.id === customer.id ? { ...item, status } : item
      )
    )
    toast.success(getStatusChangeMessage(customer.name, status))
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomersTableToolbar
        search={query.search}
        status={query.status}
        onSearchChange={(search) => updateQuery({ search })}
        onStatusChange={(status) => updateQuery({ status })}
      />
      <CustomersTable
        customers={rows}
        sort={query.sort}
        onSortChange={(column) =>
          updateQuery({ sort: getNextSort(query.sort, column) })
        }
        onStatusChange={changeStatus}
      />
      <TablePagination
        resourceName="customers"
        page={page}
        pageSize={query.pageSize}
        totalRecords={totalRecords}
        onPageChange={goToPage}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
      />
    </div>
  )
}
