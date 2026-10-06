import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ImportDetailsHeader } from "@/components/imports/import-details-header"
import { ImportFailedRows } from "@/components/imports/import-failed-rows"
import { ImportJobInfo } from "@/components/imports/import-job-info"
import { ImportProgressCard } from "@/components/imports/import-progress-card"
import { ImportTimeline } from "@/components/imports/import-timeline"
import { BackLink } from "@/components/shared/back-link"
import {
  getMockImportFailedRows,
  getMockImportJobById,
} from "@/lib/imports/import.mock-data"
import { getImportTimeline } from "@/lib/imports/import.utils"
import { routes } from "@/lib/routes"

type ImportDetailsPageProps = PageProps<"/dashboard/imports/[jobId]">

export async function generateMetadata({
  params,
}: ImportDetailsPageProps): Promise<Metadata> {
  const { jobId } = await params
  const job = getMockImportJobById(jobId)

  return { title: job ? `Import ${job.filename}` : "Import not found" }
}

export default async function ImportDetailsPage({
  params,
}: ImportDetailsPageProps) {
  const { jobId } = await params
  const job = getMockImportJobById(jobId)

  if (!job) notFound()

  const failedRows = getMockImportFailedRows(job.id)

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
              <ImportTimeline events={getImportTimeline(job)} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
