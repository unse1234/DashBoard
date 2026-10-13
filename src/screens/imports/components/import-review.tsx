"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { LoadError } from "@/components/shared/load-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { routes } from "@/config/routes"
import { useConfirmImportMutation } from "@/hooks/imports/import.mutations"
import {
  useImportErrorsQuery,
  useImportPreviewQuery,
  useImportQuery,
} from "@/hooks/imports/import.queries"
import { useNow } from "@/hooks/use-now"
import { ApiError, describeApiError, isApiError } from "@/lib/api/api-error"
import { downloadImportErrors } from "@/services/imports/import.api"
import { ImportPager } from "@/screens/imports/components/import-pager"
import { ImportPreviewTable } from "@/screens/imports/components/import-preview-table"
import { ImportRowIssues } from "@/screens/imports/components/import-row-issues"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"
import { ImportValidationSummary } from "@/screens/imports/components/import-validation-summary"
import type {
  ImportColumnMapping,
  ImportJobDetails,
} from "@/types/import.types"
import { formatDateTime } from "@/utils/format-date"
import { formatInteger } from "@/utils/format-number"
import { cn } from "@/utils/cn"
import {
  canConfirmImport,
  isPreviewHeld,
  isReportAvailable,
} from "@/utils/import.utils"

// Deadlines (preview, report) can pass while the page is open; this is how
// often the screen notices.
const DEADLINE_CHECK_INTERVAL_MS = 10_000

type ImportReviewProps = {
  importId: string
  /** How the file's headers were read; only known right after validating. */
  mapping?: ImportColumnMapping[]
  /** Moves focus to the result when it first appears, after a validation. */
  focusOnMount?: boolean
}

/**
 * One import from validation to outcome: its counts, what happened or what to
 * do next, the rows and problems, and the confirmation. The job is read from
 * the API, so it also recovers the outcome of a confirmation whose response
 * was lost.
 */
export function ImportReview({
  importId,
  mapping = [],
  focusOnMount = false,
}: ImportReviewProps) {
  const detail = useImportQuery(importId)
  const job = detail.data
  const now = useNow(DEADLINE_CHECK_INTERVAL_MS)
  const rowsHeadingId = useId()
  const issuesHeadingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [rowPage, setRowPage] = useState(1)
  const [issuePage, setIssuePage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string>()
  const { mutateAsync: confirmImport } = useConfirmImportMutation()

  const rowsHeld = job ? isPreviewHeld(job, now) : false
  const reportAvailable = job ? isReportAvailable(job, now) : false
  const rows = useImportPreviewQuery(importId, rowPage, rowsHeld)
  const issues = useImportErrorsQuery(importId, issuePage, reportAvailable)
  const hasJob = job !== undefined

  useEffect(() => {
    if (focusOnMount && hasJob) headingRef.current?.focus()
  }, [focusOnMount, hasJob])

  if (detail.isError && !job) {
    return (
      <LoadError
        resourceName="import"
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    )
  }

  if (!job) {
    return (
      <div role="status" aria-label="Loading import">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const confirmable = canConfirmImport(job, now)
  const productCount = formatInteger(job.totalRows)

  async function confirm() {
    if (!job?.previewHash) return

    try {
      const result = await confirmImport({
        importId,
        schemaVersion: job.schemaVersion,
        previewHash: job.previewHash,
      })
      if (result.processing) {
        toast.info("This import is already being created.", {
          description: "This page updates when it finishes.",
        })
      } else {
        toast.success(
          `${formatInteger(result.job.importedRows)} products created.`
        )
      }
    } catch (error) {
      // Whatever happened, the job now has an outcome of record; read it.
      void detail.refetch()
      if (isApiError(error) && error.isNetworkError) {
        // The request may have reached the server, so do not say it failed.
        throw new ApiError(error.status, [
          "We couldn't confirm the result. Check this import's status before trying again.",
        ])
      }
      throw error
    }
  }

  async function downloadReport() {
    setActionError(undefined)
    try {
      await downloadImportErrors(importId)
    } catch (error) {
      setActionError(describeApiError(error))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-lg wrap-anywhere outline-none"
            >
              {job.filename}
            </h2>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Job ID: <span className="font-mono text-xs">{job.id}</span>
            </span>
            <ImportStatusBadge status={job.status} />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ImportOutcome job={job} now={now} />
          <ImportValidationSummary job={job} mapping={mapping} />
          {actionError && (
            <Alert variant="destructive">
              <CircleAlertIcon aria-hidden="true" />
              <AlertTitle>{actionError}</AlertTitle>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            {confirmable && (
              <Button type="button" onClick={() => setConfirmOpen(true)}>
                {job.status === "failed"
                  ? "Retry import"
                  : `Create ${productCount} products`}
              </Button>
            )}
            {job.status === "completed" && (
              <Link
                href={routes.products}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View Products
              </Link>
            )}
            {reportAvailable && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void downloadReport()}
              >
                Download Error Report
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={detail.isFetching}
              onClick={() => void detail.refetch()}
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {rowsHeld && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 id={rowsHeadingId}>Rows in this file</h3>
            </CardTitle>
            <CardDescription>
              Every row, as it will be created. Review them before confirming.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {rows.isError ? (
              <LoadError
                resourceName="the rows"
                error={rows.error}
                onRetry={() => void rows.refetch()}
              />
            ) : rows.data ? (
              <>
                <ImportPreviewTable
                  rows={rows.data.items}
                  labelledBy={rowsHeadingId}
                />
                <ImportPager
                  label="Rows pagination"
                  page={rowPage}
                  totalPages={rows.data.totalPages}
                  onPageChange={setRowPage}
                />
              </>
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </CardContent>
        </Card>
      )}

      {job.errorCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3 id={issuesHeadingId}>
                Problems found ({formatInteger(job.errorCount)})
              </h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!reportAvailable ? (
              <p className="text-sm text-muted-foreground">
                The error report has expired. Validate the file again to see it.
              </p>
            ) : issues.isError ? (
              <LoadError
                resourceName="the problems"
                error={issues.error}
                onRetry={() => void issues.refetch()}
              />
            ) : issues.data ? (
              <>
                <ImportRowIssues
                  issues={issues.data.items}
                  labelledBy={issuesHeadingId}
                />
                <ImportPager
                  label="Problems pagination"
                  page={issuePage}
                  totalPages={issues.data.totalPages}
                  onPageChange={setIssuePage}
                />
              </>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Create ${productCount} products?`}
        description={
          <>
            All {productCount} products are created together with their initial
            stock, or none are. Existing products are never changed.
          </>
        }
        confirmLabel={`Create ${productCount} products`}
        pendingLabel="Creating products…"
        onConfirm={confirm}
      />
    </div>
  )
}

/** What happened to this import and what, if anything, to do next. */
function ImportOutcome({ job, now }: { job: ImportJobDetails; now: number }) {
  switch (job.status) {
    case "ready":
      return (
        <Alert role="status">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Nothing has been created yet</AlertTitle>
          <AlertDescription>
            Every row passed validation. Confirm to create the products. This
            preview expires {formatDateTime(job.previewExpiresAt)}.
          </AlertDescription>
        </Alert>
      )
    case "validation-failed":
      return (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Nothing was created</AlertTitle>
          <AlertDescription>
            An import never creates part of a file. Fix the rows with problems
            in your CSV, then validate it again.
          </AlertDescription>
        </Alert>
      )
    case "processing":
      return (
        <Alert role="status">
          <Spinner aria-hidden="true" />
          <AlertTitle>Creating products</AlertTitle>
          <AlertDescription>
            This page updates when it finishes. You can leave and come back; the
            result is kept in the import history.
          </AlertDescription>
        </Alert>
      )
    case "completed":
      return (
        <Alert role="status">
          <CircleCheckIcon aria-hidden="true" />
          <AlertTitle>
            {formatInteger(job.importedRows)} products were created
          </AlertTitle>
          <AlertDescription>
            {job.completedAt
              ? `Completed ${formatDateTime(job.completedAt)}.`
              : "Completed."}{" "}
            Each product has a Created entry in its history.
          </AlertDescription>
        </Alert>
      )
    case "failed":
      return (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>No products were created</AlertTitle>
          <AlertDescription>
            {job.failureMessage ?? "The import could not be completed."}{" "}
            {job.retryable && Date.parse(job.previewExpiresAt) > now
              ? `You can retry with the same validated file until ${formatDateTime(job.previewExpiresAt)}.`
              : "Validate the CSV again to continue."}
          </AlertDescription>
        </Alert>
      )
    case "expired":
      return (
        <Alert role="status">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>This preview expired</AlertTitle>
          <AlertDescription>
            Nothing was created. Validate the CSV again to check it against the
            current catalogue.
          </AlertDescription>
        </Alert>
      )
  }
}
