"use client"

import { useId } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { StorefrontMenu } from "@/components/storefront/layout/storefront-menu"
import {
  BagIcon,
  ShopIcon,
  StorefrontLogoIcon,
} from "@/components/storefront/storefront-icons"
import { routes } from "@/config/routes"
import { useBag } from "@/hooks/storefront/use-bag"
import { cn } from "@/utils/cn"

const itemClassName =
  "relative flex size-11 shrink-0 items-center justify-center rounded-store-sm text-store-ink outline-none transition-colors hover:bg-store-canvas focus-visible:ring-3 focus-visible:ring-store-ink/40 md:size-10"

const activeItemClassName = "bg-store-ink text-white hover:bg-store-ink"

/**
 * A white rail down the left edge from tablet width up, and the same controls
 * in a bar across the top of a phone.
 */
export function StorefrontNav() {
  const pathname = usePathname()
  const { itemCount } = useBag()
  const signOutNoteId = useId()

  const shopActive =
    pathname === routes.shop || pathname.startsWith(`${routes.shop}/`)
  const bagActive = pathname === routes.bag

  return (
    <nav
      aria-label="Storefront"
      className="flex h-14 items-center gap-2 rounded-store-sm bg-white px-3 md:sticky md:top-4 md:h-[calc(100svh-2rem)] md:w-18 md:shrink-0 md:flex-col md:gap-[31.5px] md:self-start md:px-0 md:pt-3.5 md:pb-4"
    >
      <Link href={routes.shop} aria-label="Shop home" className={itemClassName}>
        <StorefrontLogoIcon className="h-5.5 w-4 translate-y-px" />
      </Link>

      <StorefrontMenu triggerClassName={itemClassName} />

      <Link
        href={routes.shop}
        aria-label="Shop"
        aria-current={shopActive ? "page" : undefined}
        className={cn(itemClassName, shopActive && activeItemClassName)}
      >
        <ShopIcon className="size-5" />
      </Link>

      <Link
        href={routes.bag}
        aria-label={`Bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        aria-current={bagActive ? "page" : undefined}
        className={cn(itemClassName, bagActive && activeItemClassName)}
      >
        <BagIcon className="size-7" />
        {/* The bag preview carries the count from desktop width up. */}
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-store-accent px-1 text-xs leading-none font-medium text-store-ink lg:hidden"
        >
          {itemCount}
        </span>
      </Link>

      {/* Staff logout is not for shoppers, so this stays unavailable for now. It
          is aria-disabled rather than disabled so its explanation can be reached. */}
      <button
        type="button"
        aria-label="Sign out"
        aria-disabled="true"
        aria-describedby={signOutNoteId}
        title="Sign out is not available yet"
        onClick={(event) => event.preventDefault()}
        className="ml-auto flex size-11 shrink-0 cursor-not-allowed items-center justify-center rounded-store-sm bg-store-danger text-white opacity-60 outline-none focus-visible:ring-3 focus-visible:ring-store-danger/40 md:mt-auto md:ml-0 md:size-10"
      >
        <LogOutIcon className="size-5" aria-hidden="true" />
      </button>
      <span id={signOutNoteId} className="sr-only">
        Sign out is not available yet in the storefront.
      </span>
    </nav>
  )
}
