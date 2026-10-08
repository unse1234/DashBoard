"use client"

import type { ReactNode } from "react"

import { useAuth } from "@/hooks/use-auth"

type AdminOnlyProps = {
  children: ReactNode
}

/**
 * Shows its children to administrators only. Hiding the screen is a courtesy:
 * the API enforces the same rule, so staff would just get "403" responses.
 */
export function AdminOnly({ children }: AdminOnlyProps) {
  const { user } = useAuth()

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">You don&apos;t have access to this page</h2>
        <p className="text-sm text-muted-foreground">
          Only administrators can manage users. Ask an administrator if you
          need something changed.
        </p>
      </div>
    )
  }

  return children
}
