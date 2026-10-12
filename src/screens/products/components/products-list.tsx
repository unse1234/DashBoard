"use client"

import { useState } from "react"
import { toast } from "sonner"

import { LoadError } from "@/components/shared/load-error"
import { TablePagination } from "@/components/shared/table-pagination"
import { useAuth } from "@/hooks/auth/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { getTotalPages } from "@/utils/pagination"
import { useArchiveProductsMutation } from "@/hooks/products/product.mutations"
import {
  useCategoriesQuery,
  useProductsQuery,
} from "@/hooks/products/product.queries"
import { defaultProductsQuery } from "@/screens/products/product.filters"
import type { ProductsQuery } from "@/types/product.types"
import { ProductsBulkActions } from "@/screens/products/components/products-bulk-actions"
import { ProductsTable } from "@/screens/products/components/products-table"
import { ProductsTableToolbar } from "@/screens/products/components/products-table-toolbar"

const SEARCH_DEBOUNCE_MS = 300

/**
 * Owns the list controls' state and shows the matching page. Searching,
 * filtering and paging all happen in the API; the search text is sent only once
 * the user pauses typing.
 */
export function ProductsList() {
  const [query, setQuery] = useState<ProductsQuery>(defaultProductsQuery)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const search = useDebouncedValue(query.search, SEARCH_DEBOUNCE_MS)
  const { data, error, isFetching, isPlaceholderData, refetch } =
    useProductsQuery({ ...query, search })
  const { data: categories } = useCategoriesQuery()
  const { user } = useAuth()
  const { mutateAsync: archiveProducts } = useArchiveProductsMutation()

  const products = data?.products ?? []
  const totalRecords = data?.totalRecords ?? 0
  const lastPage = getTotalPages(totalRecords, query.pageSize)
  const selectedCount = products.filter(({ id }) => selectedIds.has(id)).length

  // If the list shrinks while a later page is open (products are archived here
  // and elsewhere), step back to the last page that exists. Adjusting state
  // while rendering (rather than in an effect) avoids a frame of the empty
  // page. Only fresh data counts: placeholder data is the previous page's, with
  // the previous page's total.
  if (data && !isPlaceholderData && query.page > lastPage) {
    setQuery((current) => ({ ...current, page: lastPage }))
  }

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

  // The confirmation dialog reports a failure itself, so this lets it through.
  async function deleteSelected() {
    const ids = products
      .filter(({ id }) => selectedIds.has(id))
      .map(({ id }) => id)

    await archiveProducts(ids)
    clearSelection()
    toast.success(
      ids.length === 1
        ? "1 product was deleted."
        : `${ids.length} products were deleted.`
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ProductsTableToolbar
        search={query.search}
        category={query.category}
        status={query.status}
        categories={categories ?? []}
        onSearchChange={(next) => updateQuery({ search: next })}
        onCategoryChange={(category) => updateQuery({ category })}
        onStatusChange={(status) => updateQuery({ status })}
      />
      {error ? (
        <LoadError
          resourceName="products"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          {selectedCount > 0 && (
            <ProductsBulkActions
              selectedCount={selectedCount}
              // The API refuses it for staff, so the button is not offered.
              canDelete={user?.role === "ADMIN"}
              onClearSelection={clearSelection}
              onDelete={deleteSelected}
            />
          )}
          <ProductsTable
            products={products}
            isLoading={isFetching}
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
        </>
      )}
    </div>
  )
}
