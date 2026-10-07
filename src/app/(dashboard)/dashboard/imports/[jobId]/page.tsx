import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  getMockImportFailedRows,
  getMockImportJobById,
} from "@/lib/imports/import.mock-data"
import { getImportTimeline } from "@/lib/imports/import.utils"
import { ImportDetailsScreen } from "@/screens/imports/details"

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

  return (
    <ImportDetailsScreen
      job={job}
      failedRows={getMockImportFailedRows(job.id)}
      timelineEvents={getImportTimeline(job)}
    />
  )
}
