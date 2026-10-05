import Link from "next/link"

import { routes } from "@/lib/routes"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <Link
          href={routes.home}
          className="flex w-fit items-center gap-2.5 rounded-md text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground"
          >
            D
          </span>
          Dashboard
        </Link>
        {children}
      </div>
    </main>
  )
}
