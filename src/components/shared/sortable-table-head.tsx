import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TableHead } from "@/components/ui/table"
import type { SortDirection } from "@/lib/sort"
import { cn } from "@/lib/utils"

const sortIcons = {
  asc: ArrowUpIcon,
  desc: ArrowDownIcon,
} as const satisfies Record<SortDirection, unknown>

const ariaSortValues = {
  asc: "ascending",
  desc: "descending",
} as const satisfies Record<SortDirection, string>

type SortableTableHeadProps = {
  label: string
  /** Null when this column isn't the one the table is sorted by. */
  direction: SortDirection | null
  /** Use "end" over right-aligned cells, such as amounts. */
  align?: "start" | "end"
  onSort: () => void
}

export function SortableTableHead({
  label,
  direction,
  align = "start",
  onSort,
}: SortableTableHeadProps) {
  const SortIcon = direction ? sortIcons[direction] : ArrowUpDownIcon

  return (
    <TableHead
      aria-sort={direction ? ariaSortValues[direction] : "none"}
      className={cn(align === "end" && "text-right")}
    >
      {/* The button's own padding is pulled back so the label lines up with the cells. */}
      <Button
        variant="ghost"
        size="sm"
        className={align === "end" ? "-mr-2.5" : "-ml-2.5"}
        onClick={onSort}
      >
        {label}
        <SortIcon
          aria-hidden="true"
          className={direction ? undefined : "text-muted-foreground"}
        />
      </Button>
    </TableHead>
  )
}
