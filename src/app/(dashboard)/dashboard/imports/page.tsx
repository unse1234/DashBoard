import type { Metadata } from "next"

import { ImportsScreen } from "@/screens/imports"

export const metadata: Metadata = {
  title: "Imports",
}

export default function ImportsPage() {
  return <ImportsScreen />
}
