import type { Metadata } from "next"
import { ImportDetailsScreen } from "@/screens/imports/details"

type Props = PageProps<"/dashboard/imports/[jobId]">

export const metadata: Metadata = { title: "Import job" }

export default async function ImportDetailsPage({ params }: Props) {
  const { jobId } = await params
  return <ImportDetailsScreen jobId={jobId} />
}
