import type { CSSProperties, ReactNode } from "react"

import { RequireAuth } from "@/components/auth/require-auth"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SessionRestorer } from "@/providers/session-restorer"

const shellStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {/* Beside the guard, not inside it: the guard renders nothing of its
          children until the restore has settled. */}
      <SessionRestorer />
      <RequireAuth>
        <TooltipProvider>
          <SidebarProvider style={shellStyle}>
            <AppSidebar variant="inset" />
            <SidebarInset className="min-w-0">{children}</SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </RequireAuth>
    </>
  )
}
