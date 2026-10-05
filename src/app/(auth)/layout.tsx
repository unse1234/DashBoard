import type { ReactNode } from "react"

import { AppLogo } from "@/components/shared/app-logo"

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <AppLogo />
        {children}
      </div>
    </main>
  )
}
