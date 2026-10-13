"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/config/routes"
import { useImportQuery } from "@/hooks/imports/import.queries"
import { ImportReview } from "@/screens/imports/components/import-review"
import { ImportJobInfo } from "@/screens/imports/details/components/import-job-info"
import { ImportTimeline } from "@/screens/imports/details/components/import-timeline"
import { getImportTimeline } from "@/utils/import.utils"

type ImportDetailsScreenProps = {
  /** The public id from the route, e.g. "IMP-1001". */
  jobId: string
}

export function ImportDetailsScreen({ jobId }: ImportDetailsScreenProps) {
  // The review reads the same job; both share one cache entry and one request.
  const { data: job } = useImportQuery(jobId)

  return (
    <>
      <DashboardHeader title="Import job" />
      <PageContent>
        <BackLink href={routes.imports}>Back to Imports</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-4">
              <ImportReview importId={jobId} />
            </div>
            {job && (
              <div className="flex flex-col gap-4">
                <ImportJobInfo job={job} />
                <ImportTimeline events={getImportTimeline(job)} />
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </>
  )
}
