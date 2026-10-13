"use client"

import { useState } from "react"

import { LoadError } from "@/components/shared/load-error"
import { TablePagination } from "@/components/shared/table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IMPORT_EMPTY_STATE,
  IMPORT_SCOPE_OPTIONS,
  IMPORT_STATUS_FILTER_OPTIONS,
} from "@/constants/import.constants"
import { useAuth } from "@/hooks/auth/use-auth"
import { useImportsQuery } from "@/hooks/imports/import.queries"
import { ImportJobItem } from "@/screens/imports/components/import-job-item"
import { defaultImportsQuery } from "@/screens/imports/imports.filters"
import type { ImportsQuery } from "@/types/import.types"
import { getTotalPages } from "@/utils/pagination"

function toStatusFilter(value: string | null) {
  return IMPORT_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

function toScope(value: string | null) {
  return IMPORT_SCOPE_OPTIONS.find((option) => option.value === value)?.value
}

/**
 * The imports the signed-in user started, newest first. An administrator can
 * also list everyone's; the API refuses that to staff, so the choice is not
 * offered to them.
 */
export function ImportHistory() {
  const { user } = useAuth()
  const [query, setQuery] = useState<ImportsQuery>(defaultImportsQuery)
  const { data, error, isFetching, isPlaceholderData, refetch } =
    useImportsQuery(query)

  const jobs = data?.jobs ?? []
  const totalRecords = data?.totalRecords ?? 0
  const lastPage = getTotalPages(totalRecords, query.pageSize)
  const isAdmin = user?.role === "ADMIN"

  // If the list shrinks while a later page is open, step back to the last page
  // that exists. Only fresh data counts: placeholder data is the previous
  // page's, with the previous page's total.
  if (data && !isPlaceholderData && query.page > lastPage) {
    setQuery((current) => ({ ...current, page: lastPage }))
  }

  function updateQuery(changes: Partial<Omit<ImportsQuery, "page">>) {
    setQuery((current) => ({ ...current, ...changes, page: 1 }))
  }

  return (
    <section
      aria-labelledby="import-history-heading"
      className="flex flex-col gap-3"
    >
      <h2 id="import-history-heading" className="text-base font-medium">
        Import history
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        {isAdmin && (
          <Select
            value={query.scope}
            items={IMPORT_SCOPE_OPTIONS}
            onValueChange={(value) => {
              const scope = toScope(value)
              if (scope) updateQuery({ scope })
            }}
          >
            <SelectTrigger
              aria-label="Whose imports to show"
              className="w-full sm:w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {IMPORT_SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        <Select
          value={query.status}
          items={IMPORT_STATUS_FILTER_OPTIONS}
          onValueChange={(value) => {
            const status = toStatusFilter(value)
            if (status) updateQuery({ status })
          }}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="w-full sm:w-52"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {IMPORT_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <LoadError
          resourceName="imports"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !data ? (
        <div role="status" aria-label="Loading imports" className="grid gap-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border px-4 py-10 text-center">
          <p className="font-medium">{IMPORT_EMPTY_STATE.title}</p>
          <p className="text-sm text-muted-foreground">
            {IMPORT_EMPTY_STATE.description}
          </p>
        </div>
      ) : (
        <>
          <ul
            aria-busy={isFetching}
            className="flex flex-col gap-3 data-[busy=true]:opacity-60"
            data-busy={isFetching}
          >
            {jobs.map((job) => (
              <li key={job.id}>
                <ImportJobItem job={job} showOwner={query.scope === "all"} />
              </li>
            ))}
          </ul>
          <TablePagination
            resourceName="imports"
            page={query.page}
            pageSize={query.pageSize}
            totalRecords={totalRecords}
            onPageChange={(page) =>
              setQuery((current) => ({ ...current, page }))
            }
            onPageSizeChange={(pageSize) => updateQuery({ pageSize })}
          />
        </>
      )}
    </section>
  )
}
