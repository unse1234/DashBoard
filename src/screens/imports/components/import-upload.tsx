"use client"

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react"
import { DownloadIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { formatFileSize } from "@/utils/format-file-size"
import {
  IMPORT_FILE_EXTENSION,
  IMPORT_MAX_FILE_SIZE_LABEL,
} from "@/constants/import.constants"
import { validateImportFile } from "@/validations/import.validation"
import { ImportGuidelinesDialog } from "@/screens/imports/components/import-guidelines-dialog"

function isDraggingFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files")
}

type ImportUploadProps = {
  /** Sends the chosen file for validation. Nothing is created by it. */
  onValidate: (file: File) => void
  onTemplate: () => void
  /** Called whenever the chosen file is replaced or removed. */
  onSelectionChanged?: () => void
  /** Stops a validation that is in progress. */
  onCancel?: () => void
  validating?: boolean
  /** Whole percent of the file's bytes sent so far; null before the first report. */
  uploadProgress?: number | null
}

/**
 * Lets a signed-in user pick a product CSV, with the file dialog or by
 * dropping it. Selection stays local until they choose to validate the CSV.
 */
export function ImportUpload({
  onValidate,
  onTemplate,
  onSelectionChanged,
  onCancel,
  validating = false,
  uploadProgress = null,
}: ImportUploadProps) {
  const chooseButtonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function selectFile(selectedFile: File) {
    const message = validateImportFile(selectedFile)
    onSelectionChanged?.()
    setError(message)
    setFile(message ? null : selectedFile)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    // Cleared so choosing the same file again still triggers a change.
    event.target.value = ""

    if (selectedFile) selectFile(selectedFile)
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!isDraggingFiles(event)) return

    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isDraggingFiles(event)) return

    // Without this the browser does not allow a drop here.
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Moving over a child element also fires dragleave on the area.
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return
    }

    setIsDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!isDraggingFiles(event)) return

    event.preventDefault()
    setIsDragging(false)

    const [droppedFile, ...otherFiles] = Array.from(event.dataTransfer.files)

    if (!droppedFile) return

    if (otherFiles.length > 0) {
      onSelectionChanged?.()
      setFile(null)
      setError("Drop one file at a time.")
      return
    }

    selectFile(droppedFile)
  }

  function removeFile() {
    onSelectionChanged?.()
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
          Drag a CSV file into the box or choose one, then validate it. Only{" "}
          {IMPORT_FILE_EXTENSION} files up to {IMPORT_MAX_FILE_SIZE_LABEL} are
          accepted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          role="group"
          aria-label="Product CSV drop area"
          data-dragging={isDragging ? "" : undefined}
          className="flex flex-col gap-3 rounded-lg border border-dashed p-4 transition-colors data-dragging:border-primary data-dragging:bg-muted sm:flex-row sm:items-center sm:gap-4"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {file && !isDragging ? (
              <FileTextIcon aria-hidden="true" />
            ) : (
              <UploadIcon aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1" aria-live="polite">
            <SelectionSummary
              file={file}
              isDragging={isDragging}
              onRemove={removeFile}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              variant="outline"
              aria-describedby={error ? errorId : undefined}
              onClick={() => inputRef.current?.click()}
            >
              {file ? "Replace File" : "Choose File"}
            </Button>
            <Button
              type="button"
              disabled={!file || validating}
              aria-label={file ? `Validate ${file.name}` : undefined}
              onClick={() => file && onValidate(file)}
            >
              {validating ? "Validating…" : "Validate CSV"}
            </Button>
          </div>
        </div>
        {validating && (
          <UploadProgress progress={uploadProgress} onCancel={onCancel} />
        )}
        {error && (
          <p id={errorId} role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onTemplate}>
          <DownloadIcon aria-hidden="true" />
          Download CSV Template
        </Button>
        <ImportGuidelinesDialog />
      </CardFooter>
    </Card>
  )
}

type UploadProgressProps = {
  progress: number | null
  onCancel?: () => void
}

/**
 * Real upload progress, then an indeterminate bar while the server checks the
 * rows: how long that takes is not known, so no percentage is invented for it.
 */
function UploadProgress({ progress, onCancel }: UploadProgressProps) {
  const checking = progress !== null && progress >= 100

  return (
    <div className="flex flex-col gap-2">
      <Progress value={checking ? null : progress}>
        <ProgressLabel>
          {checking ? "Checking every row" : "Uploading file"}
        </ProgressLabel>
        {!checking && progress !== null && <ProgressValue />}
      </Progress>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
    </div>
  )
}

type SelectionSummaryProps = {
  file: File | null
  isDragging: boolean
  onRemove: () => void
}

function SelectionSummary({
  file,
  isDragging,
  onRemove,
}: SelectionSummaryProps) {
  if (isDragging) {
    return <p className="font-medium">Drop the file to select it</p>
  }

  if (!file) {
    return (
      <>
        <p className="font-medium">Drag and drop a CSV file here</p>
        <p className="text-muted-foreground">
          or choose one from your computer
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex items-start gap-1">
        <p className="font-medium wrap-anywhere">{file.name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
    </>
  )
}
