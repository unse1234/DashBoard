import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export function BackToUsersLink() {
  return (
    <Link
      href={routes.users}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "-ml-2.5 w-fit",
      })}
    >
      <ArrowLeftIcon aria-hidden="true" />
      Back to Users
    </Link>
  )
}
