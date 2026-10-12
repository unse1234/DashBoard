export type SortDirection = "asc" | "desc"

export type Sort<TColumn extends string> = {
  column: TColumn
  direction: SortDirection
}
