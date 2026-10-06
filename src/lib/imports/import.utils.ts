import type {
  ImportJob,
  ImportStatus,
  ImportTimelineEvent,
} from "@/lib/imports/import.types"

/** Whole percent of the rows handled so far; stays below 100 until every row is. */
export function getImportProgress(
  job: Pick<ImportJob, "processedRows" | "totalRows">
) {
  if (job.totalRows === 0) return 0

  const percentage = Math.floor((job.processedRows / job.totalRows) * 100)

  return Math.min(100, Math.max(0, percentage))
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

/** Keeps the order of `jobs` within each status; every status is present. */
export function groupImportsByStatus(jobs: ImportJob[]) {
  const groups: Record<ImportStatus, ImportJob[]> = {
    processing: [],
    queued: [],
    completed: [],
    failed: [],
  }

  for (const job of jobs) {
    groups[job.status].push(job)
  }

  return groups
}

/** The three stages every job moves through; stages it has not reached have no timestamp. */
export function getImportTimeline(
  job: Pick<ImportJob, "status" | "createdAt" | "startedAt" | "completedAt">
): ImportTimelineEvent[] {
  const hasFailed = job.status === "failed"

  return [
    {
      id: "created",
      label: "Created",
      timestamp: job.createdAt,
      state: "done",
    },
    {
      id: "started",
      label: "Started Processing",
      timestamp: job.startedAt,
      state: job.startedAt ? "done" : "pending",
    },
    {
      id: "finished",
      label: hasFailed ? "Failed" : "Completed",
      timestamp: job.completedAt,
      state: job.completedAt ? (hasFailed ? "failed" : "done") : "pending",
    },
  ]
}
