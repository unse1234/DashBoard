export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export const DEFAULT_PAGE_SIZE: PageSize = 10

export type VisiblePage = number | "ellipsis-start" | "ellipsis-end"

export function getTotalPages(totalRecords: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalRecords / pageSize))
}

/** 1-based, inclusive range of the records on a page; `0 – 0` when empty. */
export function getRecordRange(
  page: number,
  pageSize: number,
  totalRecords: number
) {
  if (totalRecords === 0) return { from: 0, to: 0 }

  return {
    from: (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, totalRecords),
  }
}

/**
 * Page numbers to render, collapsing long runs into ellipses. The first and
 * last pages are always present and the list keeps a constant length once the
 * page count outgrows it, so the controls don't jump while paging.
 */
export function getVisiblePages(
  page: number,
  totalPages: number,
  siblings = 1
): VisiblePage[] {
  const maxVisible = siblings * 2 + 5

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const edgeRunLength = siblings * 2 + 3
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index)

  const leftSibling = Math.max(page - siblings, 1)
  const rightSibling = Math.min(page + siblings, totalPages)
  // Only collapse when the ellipsis would hide at least two pages.
  const hasStartEllipsis = leftSibling > siblings + 2
  const hasEndEllipsis = rightSibling < totalPages - siblings - 1

  if (!hasStartEllipsis) {
    return [...range(1, edgeRunLength), "ellipsis-end", totalPages]
  }

  if (!hasEndEllipsis) {
    return [
      1,
      "ellipsis-start",
      ...range(totalPages - edgeRunLength + 1, totalPages),
    ]
  }

  return [
    1,
    "ellipsis-start",
    ...range(leftSibling, rightSibling),
    "ellipsis-end",
    totalPages,
  ]
}
