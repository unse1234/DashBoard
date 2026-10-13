import { formatFileSize } from "@/utils/format-file-size"
import type { ImportStatus, ImportStatusFilter } from "@/types/import.types"

export const IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const IMPORT_FILE_EXTENSION = ".csv"

export const IMPORT_MAX_FILE_SIZE_LABEL = formatFileSize(
  IMPORT_MAX_FILE_SIZE_BYTES
)

/** The API's limit, shown before the server's own configuration has loaded. */
export const IMPORT_MAX_ROWS = 250

/** The API returns preview rows and issues in pages of this size. */
export const IMPORT_REVIEW_PAGE_SIZE = 25

/** How often a job that is being created is read again. */
export const IMPORT_POLL_INTERVAL_MS = 2000

/** After this long the page stops asking and offers a manual refresh instead. */
export const IMPORT_POLL_WINDOW_MS = 2 * 60 * 1000

export const IMPORT_STATUSES = [
  "ready",
  "validation-failed",
  "processing",
  "completed",
  "failed",
  "expired",
] as const satisfies readonly ImportStatus[]

export const IMPORT_STATUS_LABELS = {
  ready: "Ready to create",
  "validation-failed": "Needs corrections",
  processing: "Creating products",
  completed: "Completed",
  failed: "Failed",
  expired: "Expired",
} as const satisfies Record<ImportStatus, string>

export const IMPORT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...IMPORT_STATUSES.map((status) => ({
    value: status,
    label: IMPORT_STATUS_LABELS[status],
  })),
] as const satisfies readonly { value: ImportStatusFilter; label: string }[]

export const IMPORT_SCOPE_OPTIONS = [
  { value: "own", label: "My imports" },
  { value: "all", label: "All imports" },
] as const

export const IMPORT_EMPTY_STATE = {
  title: "No imports yet",
  description:
    "Validate a product CSV above. Every import you validate appears here.",
} as const

export const IMPORT_GUIDELINES = [
  "Use the CSV format. Other file types are not supported.",
  `Keep the file under ${IMPORT_MAX_FILE_SIZE_LABEL} with at most ${IMPORT_MAX_ROWS} product rows.`,
  "Include every required product column. The CSV template shows the expected columns.",
  "Give each product a unique SKU, including against products already in the catalogue.",
  "Use any category name. An existing one is matched ignoring case; a new one is created when you confirm. Prices have at most two decimals; stock is a whole number.",
] as const
