"use client"

import { useId, useRef, useState } from "react"

import { ProductCard } from "@/components/storefront/product-card"
import { StorefrontLoadError } from "@/components/storefront/storefront-load-error"
import { Button } from "@/components/ui/button"
import { useStorefrontProductsQuery } from "@/hooks/storefront/catalog.queries"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { defaultCatalogQuery } from "@/screens/storefront/catalog/catalog.filters"
import { CatalogPagination } from "@/screens/storefront/catalog/components/catalog-pagination"

// One row of the desktop grid: its images load without waiting to scroll.
const EAGER_IMAGE_COUNT = 4

// How long typing must pause before the server is asked.
const SEARCH_DEBOUNCE_MS = 300

const SKELETON_COUNT = 8

const GRID_CLASS_NAME =
  "mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:mt-10 md:gap-y-12 xl:mt-10.5 xl:grid-cols-4 xl:gap-x-12 xl:gap-y-16"

/**
 * The catalog. The server searches, sorts and pages; this keeps the text that
 * was typed and the page that was chosen, and renders what comes back.
 */
export function CatalogBrowser() {
  const [typed, setTyped] = useState("")
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const debounced = useDebouncedValue(typed, SEARCH_DEBOUNCE_MS)
  // An emptied box is not waited for: clearing shows the whole catalog at once.
  const search = (typed.trim() === "" ? "" : debounced).trim()

  // The page belongs to the search it was chosen under; a new search starts at
  // page 1 without an effect.
  const [pageChoice, setPageChoice] = useState({ search: "", page: 1 })
  const page = pageChoice.search === search ? pageChoice.page : 1

  const { data, isPending, isError, error, isPlaceholderData, refetch } =
    useStorefrontProductsQuery({ ...defaultCatalogQuery, search, page })

  function clearSearch() {
    setTyped("")
    searchRef.current?.focus()
  }

  function goToPage(next: number) {
    setPageChoice({ search, page: next })
    // The pager's own button may be about to become disabled; keep focus in
    // the results rather than letting it fall back to the page.
    resultsRef.current?.focus()
  }

  const showSkeleton =
    isPending || (isPlaceholderData && data?.products.length === 0)
  const settled = !isPending && !isPlaceholderData && data !== undefined
  const status = showSkeleton
    ? "Loading products"
    : settled && search
      ? `${data.meta.total} ${data.meta.total === 1 ? "product" : "products"} found`
      : ""

  return (
    <div className="flex flex-col">
      <h1 className="sr-only">Catalog</h1>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mx-auto flex w-full max-w-126.75 flex-col gap-1.75"
      >
        <label
          htmlFor={searchId}
          className="pl-2 text-[15.5px] leading-5 text-store-muted"
        >
          Search Item
        </label>
        <input
          ref={searchRef}
          id={searchId}
          type="search"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Apple Watch, Samsung S21, Macbook Pro, ..."
          autoComplete="off"
          maxLength={100}
          className="h-14 w-full rounded-store-md bg-white px-4 text-base font-medium text-store-ink shadow-store-field outline-none placeholder:text-store-placeholder focus-visible:ring-3 focus-visible:ring-store-ink/40 md:px-6 md:text-xl [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <p role="status" className="sr-only">
        {status}
      </p>

      {isError ? (
        <StorefrontLoadError
          resourceName="products"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : showSkeleton ? (
        <ul aria-hidden="true" className={GRID_CLASS_NAME}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <li key={index} className="flex flex-col gap-3">
              <div className="aspect-191/232 animate-pulse rounded-store-lg bg-white" />
              <div className="h-6 w-3/4 animate-pulse rounded-store-xs bg-white" />
              <div className="h-5 w-1/2 animate-pulse rounded-store-xs bg-white" />
            </li>
          ))}
        </ul>
      ) : data && data.products.length > 0 ? (
        <>
          <div
            ref={resultsRef}
            tabIndex={-1}
            aria-busy={isPlaceholderData}
            className="outline-none"
          >
            <ul
              className={`${GRID_CLASS_NAME} ${isPlaceholderData ? "opacity-60 transition-opacity" : ""}`}
            >
              {data.products.map((product, index) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    eager={index < EAGER_IMAGE_COUNT}
                  />
                </li>
              ))}
            </ul>
          </div>
          {data.meta.totalPages > 1 && (
            <CatalogPagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={goToPage}
            />
          )}
        </>
      ) : data && data.meta.total > 0 ? (
        // The page asked for is past the end (the catalog shrank meanwhile).
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-medium">There is nothing on this page.</p>
          <Button
            type="button"
            onClick={() => goToPage(1)}
            className="mt-2 h-11 rounded-store-sm border-0 bg-store-ink px-6 text-base font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"
          >
            Back to the first page
          </Button>
        </div>
      ) : search ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-medium">No products match “{search}”.</p>
          <p className="text-base text-store-muted">
            Check the spelling or try another name.
          </p>
          <Button
            type="button"
            onClick={clearSearch}
            className="mt-2 h-11 rounded-store-sm border-0 bg-store-ink px-6 text-base font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-medium">
            There are no products to show yet.
          </p>
          <p className="text-base text-store-muted">Please check back soon.</p>
        </div>
      )}
    </div>
  )
}
