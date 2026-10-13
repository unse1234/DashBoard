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
import type { ImportRowIssue } from "@/types/import.types"

type ImportRowIssuesProps = {
  issues: ImportRowIssue[]
  /** The id of the heading that names this table. */
  labelledBy: string
}

/** Every problem found in a file, one per line, in the order of the file. */
export function ImportRowIssues({ issues, labelledBy }: ImportRowIssuesProps) {
  return (
    <TableScrollRegion aria-labelledby={labelledBy}>
      <Table>
        <TableCaption className="sr-only">
          Problems found in the CSV file, with the row and column of each
        </TableCaption>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">Row</TableHead>
            <TableHead>Column</TableHead>
            <TableHead>Problem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue, index) => (
            <TableRow key={`${issue.rowNumber}-${issue.field}-${index}`}>
              <TableCell className="align-top tabular-nums">
                {issue.rowNumber}
              </TableCell>
              <TableCell className="align-top font-mono text-xs">
                {issue.field}
              </TableCell>
              <TableCell className="min-w-64 align-top whitespace-normal wrap-anywhere">
                {issue.message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScrollRegion>
  )
}
