import Link from "next/link"

import { APP_NAME } from "@/lib/app.constants"
import { routes } from "@/lib/routes"

export function AppLogo() {
  return (
    <Link
      href={routes.home}
      className="flex w-fit items-center gap-2.5 rounded-md text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
      >
        {APP_NAME.charAt(0)}
      </span>
      {APP_NAME}
    </Link>
  )
}
