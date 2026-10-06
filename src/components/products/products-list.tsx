"use client"

import { useState } from "react"

import { ProductsBulkActions } from "@/components/products/products-bulk-actions"
import { ProductsTable } from "@/components/products/products-table"
import { ProductsTableToolbar } from "@/components/products/products-table-toolbar"
import { TablePagination } from "@/components/shared/table-pagination"
import { defaultProductsQuery } from "@/lib/products/product.query"
import type { Product, ProductsQuery } from "@/lib/products/product.types"

type ProductsListProps = {
  /** The rows for the current query, as the server would return them. */
  products: Product[]
  totalRecords: number
}

/**
 * Owns the list controls' state. It does not search, filter or page `products`
 * itself: once the API exists, `query` is what gets sent to it (or written to
 * the URL) and `products` / `totalRecords` come back for that query.
 */
export function ProductsList({ products, totalRecords }: ProductsListProps) {
  const [query, setQuery] = useState<ProductsQuery>(defaultProductsQuery)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const selectedCount = products.filter(({ id }) =>
    selectedIds.has(id)
  ).length

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // Anything that changes which products are listed starts again from page one
  // and drops the selection, so bulk actions never reach rows that are no
  // longer shown.
  function updateQuery(changes: Partial<Omit<ProductsQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
    clearSelection()
  }

  function goToPage(page: number) {
    setQuery((current) => ({ ...current, page }))
    clearSelection()
  }

  function selectProduct(productId: string, selected: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (selected) {
        next.add(productId)
      } else {
        next.delete(productId)
      }
      return next
    })
  }

  function selectAll(selected: boolean) {
    setSelectedIds(selected ? new Set(products.map(({ id }) => id)) : new Set())
  }

  return (
    <div className="flex flex-col gap-4">
      <ProductsTableToolbar
        search={query.search}
        category={query.category}
        status={query.status}
        onSearchChange={(search) => updateQuery({ search })}
        onCategoryChange={(category) => updateQuery({ category })}
        onStatusChange={(status) => updateQuery({ status })}
      />
      {selectedCount > 0 && (
        <ProductsBulkActions
          selectedCount={selectedCount}
          onClearSelection={clearSelection}
        />
      )}
      <ProductsTable
        products={products}
        selectedIds={selectedIds}
        onSelectProduct={selectProduct}
        onSelectAll={selectAll}
      />
      <TablePagination
        resourceName="products"
        page={query.page}
        pageSize={query.pageSize}
        totalRecords={totalRecords}
        onPageChange={goToPage}
        onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
      />
    </div>
  )
}
