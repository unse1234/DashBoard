import type { Route } from "next"
import type { ReactNode } from "react"

import type { UserRole } from "@/lib/auth/auth.types"

export type NavItem = {
  title: string
  url: Route
  icon: ReactNode
  /** Hidden from users with any other role. */
  requiredRole?: UserRole
}
