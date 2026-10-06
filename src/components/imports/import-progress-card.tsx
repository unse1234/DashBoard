import { ImportProgress } from "@/components/imports/import-progress"
import { ImportStatusBadge } from "@/components/imports/import-status-badge"
import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatInteger } from "@/lib/format-number"
import type { ImportJob } from "@/lib/imports/import.types"
import { getImportProgress } from "@/lib/imports/import.utils"

type ImportProgressCardProps = {
  job: ImportJob
}

export function ImportProgressCard({ job }: ImportProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Import progress</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ImportProgress value={getImportProgress(job)} label="Progress" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <DetailItem label="Status">
            <ImportStatusBadge status={job.status} />
          </DetailItem>
          <DetailItem label="Total Rows">
            <RowCount value={job.totalRows} />
          </DetailItem>
          <DetailItem label="Successful Rows">
            <RowCount value={job.successfulRows} />
          </DetailItem>
          <DetailItem label="Failed Rows">
            <RowCount value={job.failedRows} />
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}

function RowCount({ value }: { value: number }) {
  return (
    <span className="text-xl font-semibold tabular-nums">
      {formatInteger(value)}
    </span>
  )
}
