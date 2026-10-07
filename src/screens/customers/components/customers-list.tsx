"use client"

import { useState } from "react"

import { TablePagination } from "@/components/shared/table-pagination"
import { defaultCustomersQuery } from "@/lib/customers/customer.query"
import type { Customer, CustomersQuery } from "@/lib/customers/customer.types"
import { getNextSort } from "@/lib/sort"
import { CustomersTable } from "@/screens/customers/components/customers-table"
import { CustomersTableToolbar } from "@/screens/customers/components/customers-table-toolbar"

type CustomersListProps = {
  /** The rows for the current query, as the server would return them. */
  customers: Customer[]
  totalRecords: number
}

/**
 * Owns the list controls' state. It does not search, sort or page `customers`
 * itself: once the API exists, `query` is what gets sent to it (or written to
 * the URL) and `customers` / `totalRecords` come back for that query.
 */
export function CustomersList({ customers, totalRecords }: CustomersListProps) {
  const [query, setQuery] = useState<CustomersQuery>(defaultCustomersQuery)

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
        onSearchChange={(search) => updateQuery({ search })}
      />
      <CustomersTable
        customers={customers}
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
    </div>
  )
}
