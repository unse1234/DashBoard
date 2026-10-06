export type ImportStatus = "processing" | "queued" | "completed" | "failed"

/** One CSV row that could not be imported. */
export type ImportFailedRow = {
  id: string
  /** Position of the row in the CSV file. */
  rowNumber: number
  /** Empty when the row has no SKU. */
  sku: string
  productName: string
  error: string
}

export type ImportJob = {
  /** Public identifier, also used in the details route. */
  id: string
  filename: string
  status: ImportStatus
  totalRows: number
  /** Rows handled so far, imported or not. Zero while queued. */
  processedRows: number
  successfulRows: number
  failedRows: number
  /** ISO 8601 timestamps; null until the job reaches that stage. */
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  /** The first few failed rows, for the job list. The details have them all. */
  sampleErrors: ImportFailedRow[]
}

export type ImportTimelineEvent = {
  id: "created" | "started" | "finished"
  label: string
  /** ISO 8601 timestamp; null while the job has not reached this step. */
  timestamp: string | null
  /** "pending" until there is a timestamp. */
  state: "done" | "pending" | "failed"
}
