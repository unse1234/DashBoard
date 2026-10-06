import { ImportJobItem } from "@/components/imports/import-job-item"
import { IMPORT_EMPTY_STATES } from "@/lib/imports/import.constants"
import type { ImportJob, ImportStatus } from "@/lib/imports/import.types"

type ImportJobListProps = {
  /** The status every job in `jobs` has; it decides the empty state. */
  status: ImportStatus
  jobs: ImportJob[]
}

export function ImportJobList({ status, jobs }: ImportJobListProps) {
  if (jobs.length === 0) {
    const { title, description } = IMPORT_EMPTY_STATES[status]

    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border px-4 py-10 text-center">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <ImportJobItem job={job} />
        </li>
      ))}
    </ul>
  )
}
