import Link from "next/link"

import { DetailItem } from "@/components/shared/detail-item"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getImportRoute } from "@/config/routes"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"
import type { ImportJob } from "@/types/import.types"
import { cn } from "@/utils/cn"
import { formatDateTime } from "@/utils/format-date"
import { formatInteger } from "@/utils/format-number"

type ImportJobItemProps = {
  job: ImportJob
  /** Whose import it is matters only when more than one person's are listed. */
  showOwner: boolean
}

export function ImportJobItem({ job, showOwner }: ImportJobItemProps) {
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
              {showOwner && (
                <>
                  {" · "}
                  {job.initiatedBy.isCurrentUser ? "You" : job.initiatedBy.name}
                </>
              )}
            </p>
          </div>
          <Link
            href={getImportRoute(job.id)}
            aria-label={`View details for ${job.filename}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View Details
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <DetailItem label="Total Rows">
            {formatInteger(job.totalRows)}
          </DetailItem>
          <DetailItem label="Rows With Errors">
            {formatInteger(job.invalidRows)}
          </DetailItem>
          <DetailItem label="Products Created">
            {formatInteger(job.importedRows)}
          </DetailItem>
          <DetailItem label="Validated">
            <time dateTime={job.createdAt}>
              {formatDateTime(job.createdAt)}
            </time>
          </DetailItem>
        </dl>
        {job.failureMessage && (
          <p className="text-sm text-destructive">{job.failureMessage}</p>
        )}
        <SampleIssues job={job} />
      </CardContent>
    </Card>
  )
}

function SampleIssues({ job }: { job: ImportJob }) {
  if (job.sampleErrors.length === 0) return null

  const hiddenCount = job.errorCount - job.sampleErrors.length

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="font-medium">Sample problems</p>
      <ul className="flex flex-col gap-1.5">
        {job.sampleErrors.map((issue, index) => (
          <li
            key={`${issue.rowNumber}-${issue.field}-${index}`}
            className="flex flex-col sm:flex-row sm:gap-3"
          >
            <span className="font-mono text-xs text-muted-foreground sm:min-w-16 sm:pt-0.5">
              Row {issue.rowNumber}
            </span>
            <span className="wrap-anywhere">{issue.message}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <p className="text-muted-foreground">
          and {formatInteger(hiddenCount)} more. Open the details to see every
          problem.
        </p>
      )}
    </div>
  )
}
