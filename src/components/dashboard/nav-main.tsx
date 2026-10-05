"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CirclePlusIcon, MailIcon } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav.types"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavMainProps = {
  items: NavItem[]
}

// "/dashboard/users/USR-1" belongs to Users, not Dashboard, so the longest
// matching url wins.
function getActiveUrl(items: NavItem[], pathname: string) {
  return items
    .map((item) => item.url as string)
    .filter((url) => pathname === url || pathname.startsWith(`${url}/`))
    .sort((a, b) => b.length - a.length)[0]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const activeUrl = getActiveUrl(items, pathname)

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <CirclePlusIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.url === activeUrl}
                render={<Link href={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
