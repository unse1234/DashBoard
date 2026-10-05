import type { Route } from "next"
import Link from "next/link"

import { APP_NAME } from "@/lib/app.constants"
import { routes } from "@/lib/routes"

type AppLogoProps = {
  href?: Route
}

export function AppLogo({ href = routes.home }: AppLogoProps) {
  return (
    <Link
      href={href}
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
