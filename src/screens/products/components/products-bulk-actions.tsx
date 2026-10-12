"use client"

import { useState } from "react"
import { DownloadIcon, Trash2Icon } from "lucide-react"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"

type ProductsBulkActionsProps = {
  selectedCount: number
  /** Deleting is for administrators; staff are not offered it. */
  canDelete: boolean
  onClearSelection: () => void
  /** Deletes the selected products. The dialog shows the error if it rejects. */
  onDelete: () => Promise<void>
}

export function ProductsBulkActions({
  selectedCount,
  canDelete,
  onClearSelection,
  onDelete,
}: ProductsBulkActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const noun = selectedCount === 1 ? "product" : "products"

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-muted/50 py-2 pr-2 pl-4"
    >
      <p className="text-sm font-medium" aria-live="polite">
        {selectedCount} {noun} selected
      </p>
      {/* Export is not connected: there is no export API yet. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
        <Button variant="outline" size="sm">
          <DownloadIcon aria-hidden="true" />
          Export
        </Button>
        {canDelete && (
          // Not the destructive variant: red text on its red tint is below the
          // AA contrast ratio, so this stays on a plain background and only
          // the border reacts to hover.
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:border-destructive/50 hover:bg-background hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2Icon aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${selectedCount} ${noun}?`}
        description="They will be removed from the catalogue and this list. Orders that include them keep their details."
        confirmLabel={`Delete ${noun}`}
        pendingLabel="Deleting…"
        destructive
        onConfirm={onDelete}
      />
    </div>
  )
}
