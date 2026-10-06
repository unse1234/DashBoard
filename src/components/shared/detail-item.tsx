import type { ReactNode } from "react"

type DetailItemProps = {
  label: string
  children: ReactNode
}

/** One label/value pair; render inside a `<dl>`. */
export function DetailItem({ label, children }: DetailItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium wrap-anywhere">{children}</dd>
    </div>
  )
}
