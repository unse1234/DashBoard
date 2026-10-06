import { DownloadIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

type ProductsBulkActionsProps = {
  selectedCount: number
  onClearSelection: () => void
}

export function ProductsBulkActions({
  selectedCount,
  onClearSelection,
}: ProductsBulkActionsProps) {
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-muted/50 py-2 pr-2 pl-4"
    >
      <p className="text-sm font-medium" aria-live="polite">
        {selectedCount} {selectedCount === 1 ? "product" : "products"} selected
      </p>
      {/* Export and Delete are not connected until their APIs exist. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
        <Button variant="outline" size="sm">
          <DownloadIcon aria-hidden="true" />
          Export
        </Button>
        <Button variant="destructive" size="sm">
          <Trash2Icon aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  )
}
