import type { ReactNode } from "react"

type AuthShellProps = {
  title: string
  description: ReactNode
  /** Secondary navigation shown below the form, e.g. a link to another screen. */
  footer?: ReactNode
  children: ReactNode
}

export function AuthShell({
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </header>
      {children}
      {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
    </div>
  )
}
