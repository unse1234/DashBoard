import { CircleCheckIcon } from "lucide-react"

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
import type { ImportPreviewRow } from "@/types/import.types"

type ImportPreviewTableProps = {
  rows: ImportPreviewRow[]
  /** The id of the heading that names this table. */
  labelledBy: string
}

/** The rows of a validated file, with the problems found in each. */
export function ImportPreviewTable({
  rows,
  labelledBy,
}: ImportPreviewTableProps) {
  return (
    <TableScrollRegion aria-labelledby={labelledBy}>
      <Table>
        <TableCaption className="sr-only">
          Rows of the CSV file and whether each can be created
        </TableCaption>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">Row</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowNumber}>
              <TableCell className="align-top tabular-nums">
                {row.rowNumber}
              </TableCell>
              <TableCell className="min-w-36 align-top whitespace-normal wrap-anywhere">
                {row.values.name}
              </TableCell>
              <TableCell className="align-top font-mono text-xs">
                {row.values.sku}
              </TableCell>
              <TableCell className="align-top whitespace-normal wrap-anywhere">
                {row.values.category}
              </TableCell>
              <TableCell className="text-right align-top tabular-nums">
                {row.values.price}
              </TableCell>
              <TableCell className="text-right align-top tabular-nums">
                {row.values.stock || "0"}
              </TableCell>
              <TableCell className="min-w-48 align-top whitespace-normal">
                <RowResult row={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScrollRegion>
  )
}

function RowResult({ row }: { row: ImportPreviewRow }) {
  if (row.issues.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <CircleCheckIcon
          aria-hidden="true"
          className="size-4 fill-green-500 dark:fill-green-400"
        />
        Valid
      </span>
    )
  }

  return (
    <ul className="flex flex-col gap-1 text-destructive">
      {row.issues.map((issue) => (
        <li key={`${issue.field}-${issue.code}`}>
          <span className="font-medium">{issue.field}:</span> {issue.message}
        </li>
      ))}
    </ul>
  )
}
