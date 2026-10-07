import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import type {
  ImportFailedRow,
  ImportJob,
  ImportTimelineEvent,
} from "@/lib/imports/import.types"
import { routes } from "@/lib/routes"
import { ImportDetailsHeader } from "@/screens/imports/details/components/import-details-header"
import { ImportFailedRows } from "@/screens/imports/details/components/import-failed-rows"
import { ImportJobInfo } from "@/screens/imports/details/components/import-job-info"
import { ImportProgressCard } from "@/screens/imports/details/components/import-progress-card"
import { ImportTimeline } from "@/screens/imports/details/components/import-timeline"

type ImportDetailsScreenProps = {
  job: ImportJob
  failedRows: ImportFailedRow[]
  timelineEvents: ImportTimelineEvent[]
}

export function ImportDetailsScreen({
  job,
  failedRows,
  timelineEvents,
}: ImportDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Import job" />
      <PageContent>
        <BackLink href={routes.imports}>Back to Imports</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <ImportDetailsHeader job={job} />
          <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-4">
              <ImportProgressCard job={job} />
              {failedRows.length > 0 && <ImportFailedRows rows={failedRows} />}
            </div>
            <div className="flex flex-col gap-4">
              <ImportJobInfo job={job} />
              <ImportTimeline events={timelineEvents} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
