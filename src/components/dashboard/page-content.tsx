import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageContentProps = {
  /** Caps the width for forms and detail pages; lists use the full width. */
  narrow?: boolean
  children: ReactNode
}

/** The padded content area that sits below the `DashboardHeader`. */
export function PageContent({ narrow = false, children }: PageContentProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6",
        narrow && "w-full max-w-3xl"
      )}
    >
      {children}
    </div>
  )
}
