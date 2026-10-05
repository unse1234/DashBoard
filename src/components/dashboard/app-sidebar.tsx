import type { ComponentProps } from "react"
import {
  ChartBarIcon,
  CircleHelpIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/dashboard/nav-documents"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import type {
  NavDocumentItem,
  NavItem,
} from "@/components/dashboard/nav.types"
import { AppLogo } from "@/components/shared/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { routes } from "@/lib/routes"

// Placeholder content: only the Dashboard entry points to a real page so far.
const user = {
  name: "Demo User",
  email: "demo@example.com",
}

const navMain: NavItem[] = [
  { title: "Dashboard", url: routes.dashboard, icon: <LayoutDashboardIcon /> },
  { title: "Lifecycle", url: "#", icon: <ListIcon /> },
  { title: "Analytics", url: "#", icon: <ChartBarIcon /> },
  { title: "Projects", url: "#", icon: <FolderIcon /> },
  { title: "Team", url: "#", icon: <UsersIcon /> },
]

const navSecondary: NavItem[] = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
]

const documents: NavDocumentItem[] = [
  { name: "Data Library", url: "#", icon: <DatabaseIcon /> },
  { name: "Reports", url: "#", icon: <FileChartColumnIcon /> },
  { name: "Word Assistant", url: "#", icon: <FileIcon /> },
]

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-3">
        <AppLogo href={routes.dashboard} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
