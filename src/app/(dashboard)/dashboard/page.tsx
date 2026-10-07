import type { Metadata } from "next"

import { OverviewScreen } from "@/screens/overview"

import data from "./data.json"

export const metadata: Metadata = {
  title: "Overview",
}

export default function DashboardPage() {
  return <OverviewScreen data={data} />
}
