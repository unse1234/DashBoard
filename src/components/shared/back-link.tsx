import type { ReactNode } from "react"
import type { Route } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

type BackLinkProps = {
  href: Route
  children: ReactNode
}

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "-ml-2.5 w-fit",
      })}
    >
      <ArrowLeftIcon aria-hidden="true" />
      {children}
    </Link>
  )
}
