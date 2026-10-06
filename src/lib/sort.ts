export type SortDirection = "asc" | "desc"

export type Sort<TColumn extends string> = {
  column: TColumn
  direction: SortDirection
}

/** Unsorted → ascending → descending → unsorted; a new column starts ascending. */
export function getNextSort<TColumn extends string>(
  current: Sort<TColumn> | null,
  column: TColumn
): Sort<TColumn> | null {
  if (current?.column !== column) return { column, direction: "asc" }
  if (current.direction === "asc") return { column, direction: "desc" }
  return null
}
