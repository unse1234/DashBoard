import { apiClient } from "@/lib/api/axios"
import { IMPORT_REVIEW_PAGE_SIZE } from "@/constants/import.constants"
import type {
  ImportColumnMapping,
  ImportConfirmResult,
  ImportJob,
  ImportJobDetails,
  ImportPage,
  ImportPreviewResult,
  ImportPreviewRow,
  ImportRowIssue,
  ImportsPage,
  ImportsQuery,
  ImportStatus,
  ImportTypeConfig,
} from "@/types/import.types"

// The API's own shapes. They stay in this file: the rest of the app sees the
// types in `import.types.ts`, with the status adapted to the UI's spelling.

type ApiImportStatus =
  | "READY"
  | "VALIDATION_FAILED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"

type ApiImportJob = Omit<ImportJob, "status"> & { status: ApiImportStatus }
type ApiImportJobDetails = Omit<ImportJobDetails, "status"> & {
  status: ApiImportStatus
}

type ApiPage<T> = {
  data: T[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

const STATUS_FROM_API = {
  READY: "ready",
  VALIDATION_FAILED: "validation-failed",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  EXPIRED: "expired",
} as const satisfies Record<ApiImportStatus, ImportStatus>

const STATUS_TO_API = Object.fromEntries(
  Object.entries(STATUS_FROM_API).map(([api, ui]) => [ui, api])
) as Record<ImportStatus, ApiImportStatus>

export function toImportStatus(status: ApiImportStatus): ImportStatus {
  return STATUS_FROM_API[status]
}

// The details overload comes first: a details object also fits the summary type.
function toJob(job: ApiImportJobDetails): ImportJobDetails
function toJob(job: ApiImportJob): ImportJob
function toJob(job: ApiImportJob | ApiImportJobDetails) {
  return { ...job, status: toImportStatus(job.status) }
}

function toPage<T>({ data, meta }: ApiPage<T>): ImportPage<T> {
  return {
    items: data,
    page: meta.page,
    totalPages: meta.totalPages,
    totalRecords: meta.total,
  }
}

function toMapping(mapping: Record<string, string>): ImportColumnMapping[] {
  return Object.entries(mapping).map(([header, column]) => ({ header, column }))
}

/** The query string of the history list; filters left at "all" are omitted. */
export function buildImportsSearchParams(query: ImportsQuery) {
  const params = new URLSearchParams({
    scope: query.scope,
    page: String(query.page),
    pageSize: String(query.pageSize),
  })
  if (query.status !== "all") params.set("status", STATUS_TO_API[query.status])

  return params
}

const jobPath = (importId: string) => `/imports/${encodeURIComponent(importId)}`

export async function getImportTypes(signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: ImportTypeConfig[] }>(
    "/imports/types",
    { signal }
  )

  return data.data[0] ?? null
}

type PreviewOptions = {
  signal?: AbortSignal
  /** Whole percent of the upload's bytes that have been sent. */
  onUploadProgress?: (percent: number) => void
}

/**
 * Validates a CSV without creating anything. `clientRequestId` makes a retry of
 * the same upload return the same job, so keep it while the file is unchanged.
 */
export async function previewImport(
  file: File,
  clientRequestId: string,
  { signal, onUploadProgress }: PreviewOptions = {}
): Promise<ImportPreviewResult> {
  const form = new FormData()
  form.append("type", "PRODUCTS")
  form.append("clientRequestId", clientRequestId)
  form.append("file", file)

  const { data } = await apiClient.post<{
    job: ApiImportJobDetails
    mapping: Record<string, string>
    preview: ApiPage<ImportPreviewRow>
    errors: ApiPage<ImportRowIssue>
  }>("/imports/preview", form, {
    signal,
    onUploadProgress: (event) => {
      if (event.total) {
        onUploadProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return {
    job: toJob(data.job),
    mapping: toMapping(data.mapping),
    rows: toPage(data.preview),
    errors: toPage(data.errors),
  }
}

export async function confirmImport(
  importId: string,
  schemaVersion: number,
  previewHash: string
): Promise<ImportConfirmResult> {
  const { data } = await apiClient.post<{
    job: ApiImportJobDetails
    processing: boolean
  }>(`${jobPath(importId)}/confirm`, { schemaVersion, previewHash })

  return { job: toJob(data.job), processing: data.processing }
}

export async function listImports(
  query: ImportsQuery,
  signal?: AbortSignal
): Promise<ImportsPage> {
  const { data } = await apiClient.get<
    ApiPage<ApiImportJob> & {
      meta: { statusCounts: Record<ApiImportStatus, number> }
    }
  >("/imports", { params: buildImportsSearchParams(query), signal })

  const statusCounts = Object.fromEntries(
    Object.entries(data.meta.statusCounts).map(([status, count]) => [
      toImportStatus(status as ApiImportStatus),
      count,
    ])
  ) as Record<ImportStatus, number>

  return {
    jobs: data.data.map(toJob),
    totalRecords: data.meta.total,
    statusCounts,
  }
}

export async function getImport(
  importId: string,
  signal?: AbortSignal
): Promise<ImportJobDetails> {
  const { data } = await apiClient.get<ApiImportJobDetails>(jobPath(importId), {
    signal,
  })

  return toJob(data)
}

export async function getImportPreview(
  importId: string,
  page: number,
  signal?: AbortSignal
) {
  const { data } = await apiClient.get<ApiPage<ImportPreviewRow>>(
    `${jobPath(importId)}/preview`,
    { params: { page, pageSize: IMPORT_REVIEW_PAGE_SIZE }, signal }
  )

  return toPage(data)
}

export async function getImportErrors(
  importId: string,
  page: number,
  signal?: AbortSignal
) {
  const { data } = await apiClient.get<ApiPage<ImportRowIssue>>(
    `${jobPath(importId)}/errors`,
    { params: { page, pageSize: IMPORT_REVIEW_PAGE_SIZE }, signal }
  )

  return toPage(data)
}

// Downloads ask for text, not a Blob, so a JSON error body stays readable.
// Excel needs the byte-order mark to read UTF-8; XHR strips it from text.
const BYTE_ORDER_MARK = "﻿"

async function saveCsv(url: string, filename: string, params?: object) {
  const { data } = await apiClient.get<string>(url, {
    params,
    responseType: "text",
  })
  const csv = data.startsWith(BYTE_ORDER_MARK) ? data : BYTE_ORDER_MARK + data

  const objectUrl = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  )
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Revoking at once can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export function downloadProductTemplate() {
  return saveCsv("/imports/templates/products", "products-import-v1.csv")
}

export function downloadImportErrors(importId: string) {
  return saveCsv(`${jobPath(importId)}/errors`, `${importId}-errors.csv`, {
    format: "csv",
  })
}
