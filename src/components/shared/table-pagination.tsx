import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getRecordRange,
  getTotalPages,
  getVisiblePages,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from "@/lib/pagination"

const PAGE_SIZE_ITEMS = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: String(size),
}))

function toPageSize(value: string | null) {
  return PAGE_SIZE_OPTIONS.find((size) => String(size) === value)
}

type UsersPaginationProps = {
  page: number
  pageSize: PageSize
  totalRecords: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

export function UsersPagination({
  page,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
}: UsersPaginationProps) {
  const totalPages = getTotalPages(totalRecords, pageSize)
  const { from, to } = getRecordRange(page, pageSize, totalRecords)

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalRecords}</span>{" "}
        users
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:justify-end">
        <div className="flex items-center gap-2">
          <Label htmlFor="users-page-size" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={String(pageSize)}
            items={PAGE_SIZE_ITEMS}
            onValueChange={(value) => {
              const next = toPageSize(value)
              if (next) onPageSizeChange(next)
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="users-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {PAGE_SIZE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Pagination aria-label="Users pagination" className="mx-0 w-auto">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                aria-label="Go to previous page"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeftIcon aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            </PaginationItem>
            {getVisiblePages(page, totalPages).map((item) => (
              <PaginationItem key={item} className="hidden sm:block">
                {typeof item === "number" ? (
                  <Button
                    variant={item === page ? "outline" : "ghost"}
                    size="icon"
                    aria-label={`Go to page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem className="px-2 text-sm font-medium sm:hidden">
              Page {page} of {totalPages}
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                aria-label="Go to next page"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
