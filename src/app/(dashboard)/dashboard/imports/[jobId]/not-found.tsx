import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"

export default function ImportNotFound() {
  return (
    <>
      <DashboardHeader title="Import job" />
      <PageContent narrow>
        <BackLink href={routes.imports}>Back to Imports</BackLink>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Import not found</h2>
          <p className="text-sm text-muted-foreground">
            There is no import with this job ID. It may have been removed, or
            the link may be incorrect.
          </p>
        </div>
      </PageContent>
    </>
  )
}
