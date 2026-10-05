import type { Route } from "next"
import type { ReactNode } from "react"

export type NavItem = {
  title: string
  url: Route
  icon: ReactNode
}

export type NavDocumentItem = {
  name: string
  url: Route
  icon: ReactNode
}
