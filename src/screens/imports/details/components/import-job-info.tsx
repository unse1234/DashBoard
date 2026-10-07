import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/format-duration"
import type { ImportJob } from "@/lib/imports/import.types"
import { getImportDurationSeconds } from "@/lib/imports/import.utils"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"

type ImportJobInfoProps = {
  job: ImportJob
}

function getDurationLabel(job: ImportJob) {
  const seconds = getImportDurationSeconds(job)

  if (seconds !== null) return formatDuration(seconds)

  return job.status === "queued" ? "Not started" : "In progress"
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
          <DetailItem label="Duration">{getDurationLabel(job)}</DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
