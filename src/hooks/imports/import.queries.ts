import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { useAuth } from "@/hooks/auth/use-auth"
import { importKeys } from "@/hooks/imports/import.keys"
import { productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import {
  IMPORT_POLL_INTERVAL_MS,
  IMPORT_POLL_WINDOW_MS,
} from "@/constants/import.constants"
import {
  getImport,
  getImportErrors,
  getImportPreview,
  getImportTypes,
  listImports,
} from "@/services/imports/import.api"
import type { ImportJobDetails, ImportsQuery } from "@/types/import.types"

// `enabled` keeps these from firing while the session is still being restored,
// or from retrying into a 401 after it has ended.

const TYPES_STALE_TIME_MS = 5 * 60 * 1000

// Row pages are bounded, hold product data, and are useless once the file is
// replaced or the import has finished: let them go soon after nothing shows them.
const PAGES_GC_TIME_MS = 30 * 1000

/** The server's limits and columns, for the upload card and the guidelines. */
export function useImportTypesQuery() {
  const { status } = useAuth()

  return useQuery({
    queryKey: importKeys.types(),
    queryFn: ({ signal }) => getImportTypes(signal),
    enabled: status === "authenticated",
    staleTime: TYPES_STALE_TIME_MS,
  })
}

/** One page of the import history. The previous page stays while the next loads. */
export function useImportsQuery(query: ImportsQuery) {
  const { status } = useAuth()

  return useQuery({
    queryKey: importKeys.list(query),
    queryFn: ({ signal }) => listImports(query, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  })
}

/**
 * Whether the poll that follows a confirmation should go on. It stops when the
 * job is no longer being created, when a read fails (the screen then offers a
 * manual refresh), and once the attempt is older than any attempt can be.
 */
export function shouldPollImport(
  job: Pick<ImportJobDetails, "status" | "startedAt"> | undefined,
  now: number
) {
  if (job?.status !== "processing") return false
  if (!job.startedAt) return true

  return now - Date.parse(job.startedAt) < IMPORT_POLL_WINDOW_MS
}

/**
 * One import. While it is being created it is read again every two seconds, so
 * the outcome of a confirmation that timed out, or of one another tab started,
 * shows up without a reload. When a read finds it newly completed the product
 * lists are refreshed, because the products now exist whoever confirmed.
 */
export function useImportQuery(importId: string) {
  const { status } = useAuth()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: importKeys.detail(importId),
    queryFn: async ({ signal }) => {
      const before = queryClient.getQueryData<ImportJobDetails>(
        importKeys.detail(importId)
      )
      const job = await getImport(importId, signal)

      if (
        before &&
        before.status !== "completed" &&
        job.status === "completed"
      ) {
        void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
        void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
        void queryClient.invalidateQueries({ queryKey: importKeys.lists() })
      }
      return job
    },
    enabled: status === "authenticated" && importId !== "",
    refetchInterval: (query) =>
      query.state.status !== "error" &&
      shouldPollImport(query.state.data, Date.now())
        ? IMPORT_POLL_INTERVAL_MS
        : false,
  })
}

/** One page of the rows a job validated. Only meaningful while its preview is held. */
export function useImportPreviewQuery(
  importId: string,
  page: number,
  enabled: boolean
) {
  const { status } = useAuth()

  return useQuery({
    queryKey: importKeys.preview(importId, page),
    queryFn: ({ signal }) => getImportPreview(importId, page, signal),
    enabled: status === "authenticated" && enabled,
    placeholderData: keepPreviousData,
    gcTime: PAGES_GC_TIME_MS,
  })
}

/** One page of the problems found in a job's file. */
export function useImportErrorsQuery(
  importId: string,
  page: number,
  enabled: boolean
) {
  const { status } = useAuth()

  return useQuery({
    queryKey: importKeys.errors(importId, page),
    queryFn: ({ signal }) => getImportErrors(importId, page, signal),
    enabled: status === "authenticated" && enabled,
    placeholderData: keepPreviousData,
    gcTime: PAGES_GC_TIME_MS,
  })
}
