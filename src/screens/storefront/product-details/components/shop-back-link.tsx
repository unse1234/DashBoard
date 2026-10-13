import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { routes } from "@/config/routes"

type ShopBackLinkProps = {
  children: ReactNode
}

/** Returns to the catalog. The padding is pulled back so the icon lines up with the content edge. */
export function ShopBackLink({ children }: ShopBackLinkProps) {
  return (
    <Link
      href={routes.shop}
      className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-store-sm pr-3 pl-2 text-xl outline-none transition-colors hover:bg-white focus-visible:ring-3 focus-visible:ring-store-ink/40"
    >
      <ChevronLeftIcon className="size-6" aria-hidden="true" />
      {children}
    </Link>
  )
}
