"use client"

import { useRef, useState } from "react"
import { CircleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { usePreviewImportMutation } from "@/hooks/imports/import.mutations"
import { useImportTypesQuery } from "@/hooks/imports/import.queries"
import { describeApiError } from "@/lib/api/api-error"
import { downloadProductTemplate } from "@/services/imports/import.api"
import { ImportHistory } from "@/screens/imports/components/import-history"
import { ImportReview } from "@/screens/imports/components/import-review"
import { ImportUpload } from "@/screens/imports/components/import-upload"
import type { ImportColumnMapping } from "@/types/import.types"

type ValidatedImport = {
  importId: string
  mapping: ImportColumnMapping[]
}

export function ImportsScreen() {
  const previewImport = usePreviewImportMutation()
  const types = useImportTypesQuery()
  const [validated, setValidated] = useState<ValidatedImport | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [error, setError] = useState<string>()
  // One key per file: if the response to an upload is lost, sending the same
  // file again returns the same job instead of creating a second one.
  const clientRequestId = useRef<string | null>(null)
  const upload = useRef<AbortController | null>(null)

  async function validate(file: File) {
    clientRequestId.current ??= crypto.randomUUID()
    const controller = new AbortController()
    upload.current = controller
    setError(undefined)
    setValidated(null)
    setUploadProgress(0)

    try {
      const result = await previewImport.mutateAsync({
        file,
        clientRequestId: clientRequestId.current,
        signal: controller.signal,
        onUploadProgress: setUploadProgress,
      })
      setValidated({ importId: result.job.id, mapping: result.mapping })
      if (result.job.status === "ready") {
        toast.success("CSV validated. Review it before creating products.")
      } else if (result.job.status === "validation-failed") {
        toast.warning("The CSV has rows that need corrections.")
      }
    } catch (caught) {
      if (controller.signal.aborted) {
        toast.info("Validation cancelled.")
      } else {
        setError(describeApiError(caught))
      }
    } finally {
      if (upload.current === controller) upload.current = null
      setUploadProgress(null)
      // Releases the File the mutation still references.
      previewImport.reset()
    }
  }

  function selectionChanged() {
    upload.current?.abort()
    clientRequestId.current = null
    setValidated(null)
    setError(undefined)
  }

  async function downloadTemplate() {
    setError(undefined)
    try {
      await downloadProductTemplate()
    } catch (caught) {
      setError(describeApiError(caught))
    }
  }

  const config = types.data

  return (
    <>
      <DashboardHeader title="Imports" />
      <PageContent narrow>
        <p className="text-sm text-muted-foreground">
          Create products from a CSV file and review past imports.
        </p>
        <ImportUpload
          validating={previewImport.isPending}
          uploadProgress={uploadProgress}
          onValidate={(file) => void validate(file)}
          onCancel={() => upload.current?.abort()}
          onTemplate={() => void downloadTemplate()}
          onSelectionChanged={selectionChanged}
        />
        {config && (
          <p className="text-sm text-muted-foreground">
            A file can hold up to {config.maxRows} products. Required columns:{" "}
            {config.columns
              .filter((column) => column.required)
              .map((column) => column.name)
              .join(", ")}
            . A category name that does not exist yet is created when you
            confirm the import.
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {validated && (
          <ImportReview
            importId={validated.importId}
            mapping={validated.mapping}
            focusOnMount
          />
        )}
        <ImportHistory />
      </PageContent>
    </>
  )
}
