"use client"

import { useCallback, useEffect, useEffectEvent, useState } from "react"

type Settled<T> = {
  /** The request this outcome belongs to. */
  key: string
  /** Latest successful result, kept while a newer request is loading. */
  data: T | undefined
  error: unknown
}

export type ApiResource<T> = {
  /** The last successful result; stale (not cleared) while reloading. */
  data: T | undefined
  /** Failure of the current request, if it failed. */
  error: unknown
  /** True until the current request has settled. */
  isLoading: boolean
  /** Fetch again, e.g. after a mutation or a failed attempt. */
  reload: () => void
}

/**
 * Loads a resource in the browser. A new `key` (or `reload()`) starts a request
 * and aborts the previous one, so a slow response can never overwrite a newer
 * one. `load` may close over anything: only `key` decides when to refetch.
 */
export function useApiResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>
): ApiResource<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [reloads, setReloads] = useState(0)
  const requestKey = `${key}#${reloads}`
  const loadResource = useEffectEvent(load)

  useEffect(() => {
    const controller = new AbortController()

    loadResource(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        setSettled({ key: requestKey, data, error: undefined })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setSettled((previous) => ({
          key: requestKey,
          data: previous?.data,
          error,
        }))
      }
    )

    return () => controller.abort()
  }, [requestKey])

  const reload = useCallback(() => setReloads((count) => count + 1), [])
  const isCurrent = settled?.key === requestKey

  return {
    data: settled?.data,
    error: isCurrent ? settled.error : undefined,
    isLoading: !isCurrent,
    reload,
  }
}
