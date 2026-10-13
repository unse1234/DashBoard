"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { storefrontFont } from "@/components/storefront/layout/storefront-font"
import { HamburgerIcon } from "@/components/storefront/storefront-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routes } from "@/config/routes"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/utils/cn"

const destinations = [
  { label: "Shop", href: routes.shop },
  { label: "Bag", href: routes.bag },
  { label: "Checkout", href: routes.checkout },
] as const

type StorefrontMenuProps = {
  /** Classes of the navigation's other controls, so the trigger matches them. */
  triggerClassName: string
}

export function StorefrontMenu({ triggerClassName }: StorefrontMenuProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Menu" className={triggerClassName}>
        <HamburgerIcon className="h-3 w-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        className={cn(
          storefrontFont.variable,
          "w-48 rounded-store-sm bg-white p-1.5 font-storefront text-base text-store-ink"
        )}
      >
        {destinations.map(({ label, href }) => (
          <DropdownMenuItem
            key={href}
            render={<Link href={href} />}
            aria-current={pathname === href ? "page" : undefined}
            className="rounded-store-xs px-3 py-2.5 text-base focus:bg-store-canvas focus:text-store-ink aria-[current=page]:font-medium"
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
