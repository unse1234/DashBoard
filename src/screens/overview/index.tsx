import type { ComponentProps } from "react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ChartAreaInteractive } from "@/screens/overview/components/chart-area-interactive"
import { DataTable } from "@/screens/overview/components/data-table"
import { SectionCards } from "@/screens/overview/components/section-cards"

type OverviewScreenProps = {
  data: ComponentProps<typeof DataTable>["data"]
}

export function OverviewScreen({ data }: OverviewScreenProps) {
  return (
    <>
      <DashboardHeader title="Overview" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </>
  )
}
