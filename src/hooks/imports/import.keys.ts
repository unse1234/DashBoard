import type { ImportsQuery } from "@/types/import.types"

/**
 * Every imports cache entry lives under `["imports"]`: `types()` for the
 * server's limits, `lists()` for every page of the history, `detail(id)` for
 * one job, and `preview(id, page)` / `errors(id, page)` for the pages of rows
 * and issues a job holds.
 */
export const importKeys = {
  all: ["imports"] as const,
  types: () => [...importKeys.all, "types"] as const,
  lists: () => [...importKeys.all, "list"] as const,
  list: (query: ImportsQuery) => [...importKeys.lists(), query] as const,
  details: () => [...importKeys.all, "detail"] as const,
  detail: (importId: string) => [...importKeys.details(), importId] as const,
  previews: (importId: string) =>
    [...importKeys.all, "preview", importId] as const,
  preview: (importId: string, page: number) =>
    [...importKeys.previews(importId), page] as const,
  errorLists: (importId: string) =>
    [...importKeys.all, "errors", importId] as const,
  errors: (importId: string, page: number) =>
    [...importKeys.errorLists(importId), page] as const,
}
