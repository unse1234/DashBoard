import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ImportUpload } from "@/components/imports/import-upload"

export const metadata: Metadata = {
  title: "Imports",
}

export default function ImportsPage() {
  return (
    <>
      <DashboardHeader title="Imports" />
      <PageContent narrow>
        <p className="text-sm text-muted-foreground">
          Import products and monitor import jobs.
        </p>
        <ImportUpload />
      </PageContent>
    </>
  )
}
