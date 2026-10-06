import type { ComponentProps } from "react"
import {
  CircleHelpIcon,
  FileUpIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SearchIcon,
  Settings2Icon,
  UserRoundCogIcon,
  UsersRoundIcon,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavSecondary } from "@/components/dashboard/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import type { NavItem } from "@/components/dashboard/nav.types"
import { AppLogo } from "@/components/shared/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { routes } from "@/lib/routes"

// Placeholder content: only Dashboard, Users, Products, Customers and Imports
// point to real pages so far.
const user = {
  name: "Demo User",
  email: "demo@example.com",
}

const navMain: NavItem[] = [
  { title: "Dashboard", url: routes.dashboard, icon: <LayoutDashboardIcon /> },
  { title: "Users", url: routes.users, icon: <UserRoundCogIcon /> },
  { title: "Products", url: routes.products, icon: <PackageIcon /> },
  { title: "Customers", url: routes.customers, icon: <UsersRoundIcon /> },
  { title: "Imports", url: routes.imports, icon: <FileUpIcon /> },
]

const navSecondary: NavItem[] = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
]

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-3">
        <AppLogo href={routes.dashboard} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
