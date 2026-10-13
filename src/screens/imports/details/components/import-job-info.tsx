import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"
import type { ImportJob } from "@/types/import.types"
import { formatDateTime } from "@/utils/format-date"
import { formatDuration } from "@/utils/format-duration"
import { getImportDurationSeconds } from "@/utils/import.utils"

type ImportJobInfoProps = {
  job: ImportJob
}

function getDurationLabel(job: ImportJob) {
  const seconds = getImportDurationSeconds(job)

  if (seconds !== null) return formatDuration(seconds)

  return job.status === "processing" ? "In progress" : "Not started"
}

export function ImportJobInfo({ job }: ImportJobInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Job information</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          <DetailItem label="Filename">{job.filename}</DetailItem>
          <DetailItem label="Job ID">
            <span className="font-mono text-xs">{job.id}</span>
          </DetailItem>
          <DetailItem label="Status">
            <ImportStatusBadge status={job.status} />
          </DetailItem>
          <DetailItem label="Started By">
            {job.initiatedBy.isCurrentUser ? "You" : job.initiatedBy.name}
          </DetailItem>
          <DetailItem label="Duration">{getDurationLabel(job)}</DetailItem>
          <DetailItem label="Rows Held Until">
            <time dateTime={job.previewExpiresAt}>
              {formatDateTime(job.previewExpiresAt)}
            </time>
          </DetailItem>
          <DetailItem label="Error Report Until">
            <time dateTime={job.errorsExpiresAt}>
              {formatDateTime(job.errorsExpiresAt)}
            </time>
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
