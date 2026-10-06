import { DownloadIcon, RotateCcwIcon } from "lucide-react"

import { ImportActionButton } from "@/components/imports/import-action-button"
import { TableScrollRegion } from "@/components/shared/table-scroll-region"
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
      <TableScrollRegion aria-labelledby="import-failed-rows-heading">
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
      </TableScrollRegion>
    </div>
  )
}
