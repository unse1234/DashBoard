import { DEFAULT_PAGE_SIZE } from "@/constants/pagination.constants"
import type { ImportsQuery } from "@/types/import.types"

export const defaultImportsQuery: ImportsQuery = {
  scope: "own",
  status: "all",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}
