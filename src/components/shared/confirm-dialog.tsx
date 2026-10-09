"use client"

import { useState, type ReactNode } from "react"
import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { describeApiError } from "@/lib/api/api-error"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  /** Shown on the confirm button while `onConfirm` is running. */
  pendingLabel: string
  /** For actions that are hard to undo; styles the confirm button as a warning. */
  destructive?: boolean
  /** The dialog closes once this resolves, and shows the error if it rejects. */
  onConfirm: () => Promise<void>
}

/** Asks before a disruptive action and reports why it failed instead of closing. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ConfirmActions
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          destructive={destructive}
          onConfirm={onConfirm}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type ConfirmActionsProps = Pick<
  ConfirmDialogProps,
  "confirmLabel" | "pendingLabel" | "destructive" | "onConfirm"
> & {
  onDone: () => void
}

// Mounted only while the dialog is open, so every opening starts without an old error.
function ConfirmActions({
  confirmLabel,
  pendingLabel,
  destructive,
  onConfirm,
  onDone,
}: ConfirmActionsProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()

  async function handleConfirm() {
    setPending(true)
    setError(undefined)
    try {
      await onConfirm()
      onDone()
    } catch (caught) {
      setError(describeApiError(caught))
      setPending(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" role="alert">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Cancel
        </DialogClose>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          disabled={pending}
          onClick={handleConfirm}
        >
          {pending ? (
            <>
              <Spinner aria-hidden="true" />
              {pendingLabel}
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
