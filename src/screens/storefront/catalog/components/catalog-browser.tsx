"use client"

import { useId, useMemo, useRef, useState } from "react"

import { ProductCard } from "@/components/storefront/product-card"
import { Button } from "@/components/ui/button"
import type { StorefrontProduct } from "@/types/storefront/product.types"
import { cn } from "@/utils/cn"
import { filterProductsByQuery } from "@/utils/storefront/catalog.utils"

type CatalogBrowserProps = {
  products: StorefrontProduct[]
}

// One row of the desktop grid: its images load without waiting to scroll.
const EAGER_IMAGE_COUNT = 4

export function CatalogBrowser({ products }: CatalogBrowserProps) {
  const [query, setQuery] = useState("")
  const searchId = useId()
  const searchRef = useRef<HTMLInputElement>(null)

  const visibleProducts = useMemo(
    () => filterProductsByQuery(products, query),
    [products, query]
  )
  const searchTerm = query.trim()

  function clearSearch() {
    setQuery("")
    searchRef.current?.focus()
  }

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
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Apple Watch, Samsung S21, Macbook Pro, ..."
          autoComplete="off"
          className="h-14 w-full rounded-store-md bg-white px-4 text-base font-medium text-store-ink shadow-store-field outline-none placeholder:text-store-placeholder focus-visible:ring-3 focus-visible:ring-store-ink/40 md:px-6 md:text-xl [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <p role="status" className="sr-only">
        {searchTerm
          ? `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"} found`
          : ""}
      </p>

      {visibleProducts.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:mt-10 md:gap-y-12 xl:mt-10.5 xl:grid-cols-4 xl:gap-x-12 xl:gap-y-16">
          {visibleProducts.map((product, index) => (
            <li
              key={product.id}
              className={cn(product.tile === "wide" && "col-span-2")}
            >
              <ProductCard
                product={product}
                eager={index < EAGER_IMAGE_COUNT}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-xl font-medium">
            No products match “{searchTerm}”.
          </p>
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
      )}
    </div>
  )
}
