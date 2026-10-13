import { Button } from "@/components/ui/button"

type ImportPagerProps = {
  /** Names the pager for assistive technology, e.g. "Rows pagination". */
  label: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * Previous and next for the fixed-size pages of a job's rows and issues. The
 * shared table pagination also offers page sizes, which the API caps lower
 * than those options.
 */
export function ImportPager({
  label,
  page,
  totalPages,
  onPageChange,
}: ImportPagerProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
