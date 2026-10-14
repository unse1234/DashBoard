import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type CatalogPaginationProps = {
  /** The page being shown, from the server's `meta`. */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const buttonClassName =
  "h-11 gap-1 rounded-store-sm border-0 bg-white px-4 text-base font-medium text-store-ink hover:bg-white/70 focus-visible:ring-store-ink/40"

/** Previous and next, between the pages the server says there are. */
export function CatalogPagination({
  page,
  totalPages,
  onPageChange,
}: CatalogPaginationProps) {
  return (
    <nav
      aria-label="Catalog pages"
      className="mt-10 flex items-center justify-center gap-4 md:mt-12"
    >
      <Button
        type="button"
        className={buttonClassName}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
        Previous
      </Button>
      <p className="text-base text-store-muted" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <Button
        type="button"
        className={buttonClassName}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRightIcon aria-hidden="true" className="size-5" />
      </Button>
    </nav>
  )
}
