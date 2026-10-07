import Link from "next/link"
import { FileWarningIcon, RotateCcwIcon } from "lucide-react"

import { DetailItem } from "@/components/shared/detail-item"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import { formatInteger } from "@/lib/format-number"
import type { ImportJob } from "@/lib/imports/import.types"
import { getImportProgress } from "@/lib/imports/import.utils"
import { getImportRoute } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { ImportActionButton } from "@/screens/imports/components/import-action-button"
import { ImportProgress } from "@/screens/imports/components/import-progress"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"

type ImportJobItemProps = {
  job: ImportJob
}

export function ImportJobItem({ job }: ImportJobItemProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-medium wrap-anywhere">{job.filename}</h3>
              <ImportStatusBadge status={job.status} />
            </div>
            <p className="text-muted-foreground">
              Job ID: <span className="font-mono text-xs">{job.id}</span>
            </p>
          </div>
          <ImportJobActions job={job} />
        </div>
        <ImportJobSummary job={job} />
        {job.status === "failed" && <SampleErrors job={job} />}
      </CardContent>
    </Card>
  )
}

type ImportJobPartProps = {
  job: ImportJob
}

// Not connected until the imports API exists; each button then gets its mutation.
function ImportJobActions({ job }: ImportJobPartProps) {
  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      {job.status === "processing" && (
        <ViewJobLink job={job}>View Details</ViewJobLink>
      )}
      {job.status === "queued" && (
        <ImportActionButton
          variant="outline"
          size="sm"
          aria-label={`Cancel import ${job.filename}`}
        >
          Cancel
        </ImportActionButton>
      )}
      {job.status === "completed" && (
        <ViewJobLink job={job}>View Report</ViewJobLink>
      )}
      {job.status === "failed" && (
        <>
          <ImportActionButton
            variant="outline"
            size="sm"
            aria-label={`Download error report for ${job.filename}`}
          >
            <FileWarningIcon aria-hidden="true" />
            Error Report
          </ImportActionButton>
          <ImportActionButton
            variant="outline"
            size="sm"
            aria-label={`Retry import ${job.filename}`}
          >
            <RotateCcwIcon aria-hidden="true" />
            Retry
          </ImportActionButton>
          <ViewJobLink job={job}>View Details</ViewJobLink>
        </>
      )}
    </div>
  )
}

type ViewJobLinkProps = ImportJobPartProps & {
  children: string
}

function ViewJobLink({ job, children }: ViewJobLinkProps) {
  return (
    <Link
      href={getImportRoute(job.id)}
      aria-label={`${children} for ${job.filename}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      {children}
    </Link>
  )
}

function ImportJobSummary({ job }: ImportJobPartProps) {
  if (job.status === "processing") {
    return (
      <ImportProgress
        value={getImportProgress(job)}
        label={`${formatInteger(job.processedRows)} of ${formatInteger(job.totalRows)} rows processed`}
      />
    )
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {job.status !== "queued" && (
        <DetailItem label="Successful Rows">
          {formatInteger(job.successfulRows)}
        </DetailItem>
      )}
      {job.status === "failed" && (
        <DetailItem label="Failed Rows">
          {formatInteger(job.failedRows)}
        </DetailItem>
      )}
      <DetailItem label="Total Rows">{formatInteger(job.totalRows)}</DetailItem>
      {job.status === "queued" && (
        <DetailItem label="Created">
          <time dateTime={job.createdAt}>{formatDateTime(job.createdAt)}</time>
        </DetailItem>
      )}
      {job.completedAt && (
        <DetailItem label="Completed">
          <time dateTime={job.completedAt}>
            {formatDateTime(job.completedAt)}
          </time>
        </DetailItem>
      )}
    </dl>
  )
}

function SampleErrors({ job }: ImportJobPartProps) {
  if (job.sampleErrors.length === 0) return null

  const hiddenCount = job.failedRows - job.sampleErrors.length

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="font-medium">Sample errors</p>
      <ul className="flex flex-col gap-1.5">
        {job.sampleErrors.map((row) => (
          <li key={row.id} className="flex flex-col sm:flex-row sm:gap-3">
            <span className="font-mono text-xs text-muted-foreground sm:min-w-16 sm:pt-0.5">
              Row {row.rowNumber}
            </span>
            <span className="wrap-anywhere">{row.error}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <p className="text-muted-foreground">
          and {formatInteger(hiddenCount)} more. View the details to see every
          failed row.
        </p>
      )}
    </div>
  )
}
