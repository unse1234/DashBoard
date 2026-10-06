import { formatFileSize } from "@/lib/format-file-size"
import type { ImportStatus } from "@/lib/imports/import.types"

export const IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const IMPORT_FILE_EXTENSION = ".csv"

export const IMPORT_MAX_FILE_SIZE_LABEL = formatFileSize(
  IMPORT_MAX_FILE_SIZE_BYTES
)

/** In the order the job tabs are shown. */
export const IMPORT_STATUSES = [
  "processing",
  "queued",
  "completed",
  "failed",
] as const satisfies readonly ImportStatus[]

export const IMPORT_STATUS_LABELS = {
  processing: "Processing",
  queued: "Queued",
  completed: "Completed",
  failed: "Failed",
} as const satisfies Record<ImportStatus, string>

export const IMPORT_EMPTY_STATES = {
  processing: {
    title: "No imports currently processing",
    description: "Imports appear here while their rows are being processed.",
  },
  queued: {
    title: "No imports waiting in the queue",
    description: "Imports appear here until they start processing.",
  },
  completed: {
    title: "No completed imports yet",
    description: "Imports that finish without errors appear here.",
  },
  failed: {
    title: "No failed imports",
    description: "Imports with rows that could not be imported appear here.",
  },
} as const satisfies Record<ImportStatus, { title: string; description: string }>

export const IMPORT_GUIDELINES = [
  "Use the CSV format. Other file types are not supported.",
  `Keep the file under ${IMPORT_MAX_FILE_SIZE_LABEL}.`,
  "Include every required product column. The CSV template shows the expected columns.",
  "Give each product a unique SKU, because the SKU identifies a product.",
  "Match the expected formats, for example numbers for prices and whole numbers for stock quantities.",
] as const
