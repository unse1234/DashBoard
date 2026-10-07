import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IMPORT_STATUSES,
  IMPORT_STATUS_LABELS,
} from "@/lib/imports/import.constants"
import type { ImportJob } from "@/lib/imports/import.types"
import { groupImportsByStatus } from "@/lib/imports/import.utils"
import { ImportJobList } from "@/screens/imports/components/import-job-list"

type ImportJobTabsProps = {
  /** All jobs; they are split into tabs by status here. */
  jobs: ImportJob[]
}

export function ImportJobTabs({ jobs }: ImportJobTabsProps) {
  const jobsByStatus = groupImportsByStatus(jobs)

  return (
    <section aria-labelledby="import-jobs-heading" className="flex flex-col gap-3">
      <h2 id="import-jobs-heading" className="text-base font-medium">
        Import jobs
      </h2>
      <Tabs defaultValue="processing" className="gap-3">
        {/* Scrolls instead of overflowing the page on very narrow screens. */}
        <TabsList className="max-w-full justify-start overflow-x-auto">
          {IMPORT_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status} className="flex-none">
              {IMPORT_STATUS_LABELS[status]} ({jobsByStatus[status].length})
            </TabsTrigger>
          ))}
        </TabsList>
        {IMPORT_STATUSES.map((status) => (
          <TabsContent key={status} value={status}>
            <ImportJobList status={status} jobs={jobsByStatus[status]} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
