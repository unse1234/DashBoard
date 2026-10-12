import type { Metadata } from "next"

import { mockImportJobs } from "@/mocks/imports/import.mock-data"
import { ImportsScreen } from "@/screens/imports"

export const metadata: Metadata = {
  title: "Imports",
}

export default function ImportsPage() {
  return <ImportsScreen jobs={mockImportJobs} />
}
