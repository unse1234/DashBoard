import type { ReactElement, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderOptions } from "@testing-library/react"

import { QUERY_STALE_TIME_MS } from "@/lib/query/query-client"

/** The production defaults, except that nothing is retried, so a failure shows up at once. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: QUERY_STALE_TIME_MS },
      mutations: { retry: false },
    },
  })
}

/** A wrapper for `renderHook`; each call gets its own cache. */
export function createQueryWrapper(
  queryClient: QueryClient = createTestQueryClient()
) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

/** `render` inside a fresh `QueryClientProvider`; the client is returned for assertions. */
export function renderWithQuery(
  ui: ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {}
) {
  const queryClient = createTestQueryClient()
  return {
    queryClient,
    ...render(ui, { wrapper: createQueryWrapper(queryClient), ...options }),
  }
}
