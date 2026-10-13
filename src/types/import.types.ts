import type { PageSize } from "@/types/pagination.types"

/**
 * `ready` means every row passed validation and nothing is created until the
 * owner confirms. `validation-failed` and `expired` jobs create nothing, ever.
 */
export type ImportStatus =
  | "ready"
  | "validation-failed"
  | "processing"
  | "completed"
  | "failed"
  | "expired"

export type ImportStatusFilter = ImportStatus | "all"

/** One problem found in the CSV, reported against its row. */
export type ImportRowIssue = {
  /** Position of the record in the CSV file; the header row is row 1. */
  rowNumber: number
  field: string
  code: string
  /** Written by the API. It never repeats what the file contained. */
  message: string
}

/** The cells of a CSV row after trimming; blank optional cells stay empty. */
export type ImportRowValues = {
  name: string
  sku: string
  category: string
  price: string
  costPrice: string
  stock: string
  status: string
  brand: string
  description: string
}

export type ImportPreviewRow = {
  rowNumber: number
  values: ImportRowValues
  issues: ImportRowIssue[]
}

/** A page of preview rows or row issues. */
export type ImportPage<T> = {
  items: T[]
  page: number
  totalPages: number
  totalRecords: number
}

/** How one header of the uploaded file was understood. */
export type ImportColumnMapping = {
  /** The header exactly as it appears in the file. */
  header: string
  /** The product field it fills, as the API names it. */
  column: string
}

export type ImportJob = {
  /** Public identifier such as "IMP-1001"; also used in the details route. */
  id: string
  filename: string
  status: ImportStatus
  initiatedBy: { name: string; isCurrentUser: boolean }
  totalRows: number
  validRows: number
  invalidRows: number
  /** Zero until the whole file is created, then every row. */
  importedRows: number
  /** ISO 8601 timestamps. */
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  /** After this the validated rows are gone and the file must be uploaded again. */
  previewExpiresAt: string
  /** After this the row-by-row error report is gone. */
  errorsExpiresAt: string
  /** A failed job can be confirmed again while its preview is still held. */
  retryable: boolean
  failureCode: string | null
  failureMessage: string | null
  /** The first few issues, for the list. The details have every one. */
  sampleErrors: ImportRowIssue[]
  errorCount: number
}

export type ImportJobDetails = ImportJob & {
  schemaVersion: number
  /** Only the owner of a confirmable job receives it; confirming needs it. */
  previewHash: string | null
  /** Public product ids, filled once the import completed. */
  createdProductIds: string[]
}

/** What validating a file returns: the job and the first page of what it holds. */
export type ImportPreviewResult = {
  job: ImportJobDetails
  mapping: ImportColumnMapping[]
  rows: ImportPage<ImportPreviewRow>
  errors: ImportPage<ImportRowIssue>
}

export type ImportConfirmResult = {
  job: ImportJobDetails
  /** True when another request already holds the import and it has not finished. */
  processing: boolean
}

export type ImportsQuery = {
  /** Only an administrator may ask for everyone's imports. */
  scope: "own" | "all"
  status: ImportStatusFilter
  page: number
  pageSize: PageSize
}

export type ImportsPage = {
  jobs: ImportJob[]
  totalRecords: number
  /** Per status across the whole scope, whatever status filter is applied. */
  statusCounts: Record<ImportStatus, number>
}

/** The limits and columns the server enforces; the UI shows them, never trusts them. */
export type ImportTypeConfig = {
  maxFileBytes: number
  maxRows: number
  previewTtlSeconds: number
  columns: { name: string; required: boolean }[]
}

export type ImportTimelineEvent = {
  id: "created" | "awaiting" | "started" | "finished"
  label: string
  /** ISO 8601 timestamp; null while the job has not reached this step. */
  timestamp: string | null
  /** "pending" until there is a timestamp. */
  state: "done" | "pending" | "failed"
}
