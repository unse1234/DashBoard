import type { Metadata } from "next"

import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DataTable } from "@/components/dashboard/data-table"
import { SectionCards } from "@/components/dashboard/section-cards"

import data from "./data.json"

export const metadata: Metadata = {
  title: "Overview",
}

export default function DashboardPage() {
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
