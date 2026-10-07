import { DownloadIcon, FileWarningIcon } from "lucide-react"

import type { ImportJob } from "@/lib/imports/import.types"
import { ImportActionButton } from "@/screens/imports/components/import-action-button"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"

type ImportDetailsHeaderProps = {
  job: ImportJob
}

export function ImportDetailsHeader({ job }: ImportDetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-xl font-medium wrap-anywhere">{job.filename}</h2>
          <ImportStatusBadge status={job.status} />
        </div>
        <p className="text-muted-foreground">
          Job ID: <span className="font-mono text-xs">{job.id}</span>
        </p>
      </div>
      {/* Not connected until the imports API exists. */}
      <div className="flex flex-wrap gap-2">
        <ImportActionButton variant="outline">
          <DownloadIcon aria-hidden="true" />
          Download Original File
        </ImportActionButton>
        {job.failedRows > 0 && (
          <ImportActionButton variant="outline">
            <FileWarningIcon aria-hidden="true" />
            Download Error Report
          </ImportActionButton>
        )}
      </div>
    </div>
  )
}
