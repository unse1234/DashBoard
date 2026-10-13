import type {
  ImportJob,
  ImportJobDetails,
  ImportTimelineEvent,
} from "@/types/import.types"

/**
 * Whether the validated rows are still held and can be reviewed. After the
 * preview expires the API has already dropped them.
 */
export function isPreviewHeld(
  job: Pick<ImportJob, "status" | "previewExpiresAt">,
  now: number
) {
  return (
    (job.status === "ready" ||
      job.status === "validation-failed" ||
      job.status === "failed") &&
    Date.parse(job.previewExpiresAt) > now
  )
}

/** Only the owner receives the hash, and only while confirming can still work. */
export function canConfirmImport(
  job: Pick<ImportJobDetails, "status" | "previewExpiresAt" | "retryable"> & {
    previewHash: string | null
  },
  now: number
) {
  if (!job.previewHash) return false
  if (Date.parse(job.previewExpiresAt) <= now) return false

  return job.status === "ready" || (job.status === "failed" && job.retryable)
}

/** Whether the row-by-row error report can still be read or downloaded. */
export function isReportAvailable(
  job: Pick<ImportJob, "errorCount" | "errorsExpiresAt">,
  now: number
) {
  return job.errorCount > 0 && Date.parse(job.errorsExpiresAt) > now
}

/** Null until the job has both started and finished. */
export function getImportDurationSeconds(
  job: Pick<ImportJob, "startedAt" | "completedAt">
) {
  if (!job.startedAt || !job.completedAt) return null

  return (
    (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) /
    1000
  )
}

/** Only the steps the job has reached, plus the one it is waiting on. */
export function getImportTimeline(
  job: Pick<ImportJob, "status" | "createdAt" | "startedAt" | "completedAt">
): ImportTimelineEvent[] {
  const events: ImportTimelineEvent[] = [
    {
      id: "created",
      label: "File validated",
      timestamp: job.createdAt,
      state: "done",
    },
  ]

  if (job.status === "ready") {
    events.push({
      id: "awaiting",
      label: "Waiting for confirmation",
      timestamp: null,
      state: "pending",
    })
  }

  if (job.startedAt) {
    events.push({
      id: "started",
      label: "Started creating products",
      timestamp: job.startedAt,
      state: "done",
    })
  }

  if (job.completedAt) {
    const failed = job.status === "failed"
    events.push({
      id: "finished",
      label: failed ? "Failed" : "Completed",
      timestamp: job.completedAt,
      state: failed ? "failed" : "done",
    })
  }

  return events
}
