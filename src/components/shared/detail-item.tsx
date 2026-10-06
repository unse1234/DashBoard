import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DetailItemProps = {
  label: string
  className?: string
  children: ReactNode
}

/** One label/value pair; render inside a `<dl>`. */
export function DetailItem({ label, className, children }: DetailItemProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium wrap-anywhere">{children}</dd>
    </div>
  )
}
