"use client"

import { useEffect, type ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { clearCacheOnAccountChange } from "@/lib/query/auth-cache"
import { getQueryClient } from "@/lib/query/query-client"

type QueryProviderProps = {
  children: ReactNode
}

/** Makes server data available to every screen and ties its cache to the signed-in account. */
export function QueryProvider({ children }: QueryProviderProps) {
  // Not created with useState: the browser client is a singleton (see getQueryClient).
  const queryClient = getQueryClient()

  useEffect(() => clearCacheOnAccountChange(queryClient), [queryClient])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
