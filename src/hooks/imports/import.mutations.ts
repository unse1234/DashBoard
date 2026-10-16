import { useMutation, useQueryClient } from "@tanstack/react-query"

import { importKeys } from "@/hooks/imports/import.keys"
import { categoryKeys, productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import { confirmImport, previewImport } from "@/services/imports/import.api"

type PreviewVariables = {
  file: File
  /** Keep it while the file is unchanged: a retry then returns the same job. */
  clientRequestId: string
  signal?: AbortSignal
  onUploadProgress?: (percent: number) => void
}

/**
 * Validates a file. Nothing is created. The first page of rows and issues the
 * API returned is cached next to the job, so the review renders without a
 * second round trip.
 */
export function usePreviewImportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      clientRequestId,
      signal,
      onUploadProgress,
    }: PreviewVariables) =>
      previewImport(file, clientRequestId, { signal, onUploadProgress }),
    onSuccess: ({ job, rows, errors }) => {
      queryClient.setQueryData(importKeys.detail(job.id), job)
      queryClient.setQueryData(importKeys.preview(job.id, 1), rows)
      queryClient.setQueryData(importKeys.errors(job.id, 1), errors)
      void queryClient.invalidateQueries({ queryKey: importKeys.lists() })
    },
  })
}

/**
 * Creates the validated products, and any new categories they name, all or
 * none. The job is replaced with what the API returned. When it completed, the
 * products exist: their lists and the categories are refreshed and the rows the
 * preview held are dropped.
 */
export function useConfirmImportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      importId,
      schemaVersion,
      previewHash,
    }: {
      importId: string
      schemaVersion: number
      previewHash: string
    }) => confirmImport(importId, schemaVersion, previewHash),
    onSuccess: ({ job }) => {
      queryClient.setQueryData(importKeys.detail(job.id), job)
      void queryClient.invalidateQueries({ queryKey: importKeys.lists() })

      if (job.status === "completed") {
        queryClient.removeQueries({ queryKey: importKeys.previews(job.id) })
        void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
        void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
        // The file may have introduced categories the filter and form should offer.
        void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      }
    },
  })
}
