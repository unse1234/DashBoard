"use client"

import { useId, useRef, useState, type ChangeEvent } from "react"
import { DownloadIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react"

import { ImportActionButton } from "@/components/imports/import-action-button"
import { ImportGuidelinesDialog } from "@/components/imports/import-guidelines-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatFileSize } from "@/lib/format-file-size"
import {
  IMPORT_FILE_EXTENSION,
  IMPORT_MAX_FILE_SIZE_LABEL,
} from "@/lib/imports/import.constants"
import { validateImportFile } from "@/lib/imports/import.validation"

/**
 * Lets an admin pick a product CSV. The chosen file only lives in this
 * component's state: nothing is uploaded or read until the API exists.
 */
export function ImportUpload() {
  const chooseButtonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    // Cleared so choosing the same file again still triggers a change.
    event.target.value = ""

    if (!selectedFile) return

    const message = validateImportFile(selectedFile)
    setError(message)
    setFile(message ? null : selectedFile)
  }

  function removeFile() {
    setFile(null)
    setError(null)
    // The remove button is about to disappear, so keep focus somewhere useful.
    chooseButtonRef.current?.focus()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Import products</h2>
        </CardTitle>
        <CardDescription>
          Select a CSV file with the products to import. Only{" "}
          {IMPORT_FILE_EXTENSION} files up to {IMPORT_MAX_FILE_SIZE_LABEL} are
          accepted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {file ? (
              <FileTextIcon aria-hidden="true" />
            ) : (
              <UploadIcon aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1" aria-live="polite">
            {file ? (
              <>
                <p className="font-medium wrap-anywhere">{file.name}</p>
                <p className="text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </>
            ) : (
              <p className="font-medium">No file selected</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={`${IMPORT_FILE_EXTENSION},text/csv`}
              aria-label="Product CSV file"
              hidden
              onChange={handleFileChange}
            />
            <Button
              ref={chooseButtonRef}
              type="button"
              variant={file ? "outline" : "default"}
              aria-describedby={error ? errorId : undefined}
              onClick={() => inputRef.current?.click()}
            >
              {file ? "Replace File" : "Choose File"}
            </Button>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${file.name}`}
                onClick={removeFile}
              >
                <XIcon aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <ImportActionButton variant="outline" size="sm">
          <DownloadIcon aria-hidden="true" />
          Download CSV Template
        </ImportActionButton>
        <ImportGuidelinesDialog />
      </CardFooter>
    </Card>
  )
}
