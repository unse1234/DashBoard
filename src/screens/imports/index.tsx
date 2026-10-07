import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import type { ImportJob } from "@/lib/imports/import.types"
import { ImportJobTabs } from "@/screens/imports/components/import-job-tabs"
import { ImportUpload } from "@/screens/imports/components/import-upload"

type ImportsScreenProps = {
  jobs: ImportJob[]
}

export function ImportsScreen({ jobs }: ImportsScreenProps) {
  return (
    <>
      <DashboardHeader title="Imports" />
      <PageContent narrow>
        <p className="text-sm text-muted-foreground">
          Import products and monitor import jobs.
        </p>
        <ImportUpload />
        <ImportJobTabs jobs={jobs} />
      </PageContent>
    </>
  )
}
