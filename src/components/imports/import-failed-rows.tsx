import { DownloadIcon, RotateCcwIcon } from "lucide-react"

import { ImportActionButton } from "@/components/imports/import-action-button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ImportFailedRow } from "@/lib/imports/import.types"

type ImportFailedRowsProps = {
  rows: ImportFailedRow[]
}

export function ImportFailedRows({ rows }: ImportFailedRowsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 id="import-failed-rows-heading" className="text-base font-medium">
          Failed Rows ({rows.length})
        </h3>
        {/* Not connected until the imports API exists. */}
        <div className="flex flex-wrap gap-2">
          <ImportActionButton variant="outline" size="sm">
            <DownloadIcon aria-hidden="true" />
            Export Errors
          </ImportActionButton>
          <ImportActionButton variant="outline" size="sm">
            <RotateCcwIcon aria-hidden="true" />
            Retry Failed
          </ImportActionButton>
        </div>
      </div>
      {/* The table can be wider than the screen, and nothing inside it is
          focusable, so the scrolling area is a named, focusable region itself.
          The table's own wrapper must not scroll or this one never would. */}
      <div
        role="region"
        aria-labelledby="import-failed-rows-heading"
        tabIndex={0}
        className="overflow-x-auto rounded-lg border outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_[data-slot=table-container]]:overflow-visible"
      >
        <Table>
          <TableCaption className="sr-only">
            Rows that could not be imported, with the reason for each
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Row #</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top tabular-nums">
                  {row.rowNumber}
                </TableCell>
                <TableCell className="align-top font-mono text-xs">
                  {row.sku || (
                    <span className="font-sans text-sm text-muted-foreground">
                      Missing
                    </span>
                  )}
                </TableCell>
                <TableCell className="min-w-36 align-top whitespace-normal">
                  {row.productName}
                </TableCell>
                <TableCell className="min-w-64 align-top whitespace-normal wrap-anywhere">
                  {row.error}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
