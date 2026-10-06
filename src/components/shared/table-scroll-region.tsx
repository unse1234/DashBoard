import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Wraps a table that can be wider than the screen but has nothing focusable
 * inside, so keyboard users could not scroll it. The scrolling area is a
 * focusable region itself and needs a name, from `aria-labelledby` or
 * `aria-label`. The table's own wrapper must not scroll or this one never would.
 */
export function TableScrollRegion({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      role="region"
      tabIndex={0}
      className={cn(
        "overflow-x-auto rounded-lg border outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_[data-slot=table-container]]:overflow-visible",
        className
      )}
      {...props}
    />
  )
}
