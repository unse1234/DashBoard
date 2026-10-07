import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import type { ProductHistoryEntry } from "@/lib/products/product.types"

type ProductHistoryProps = {
  /** Newest first. */
  entries: ProductHistoryEntry[]
}

export function ProductHistory({ entries }: ProductHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Edit history</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground">
            No changes have been recorded for this product.
          </p>
        ) : (
          <ol className="flex flex-col divide-y">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="font-medium wrap-anywhere">{entry.change}</p>
                  <p className="text-muted-foreground">
                    {entry.actor ?? "System"}
                  </p>
                </div>
                <time
                  dateTime={entry.occurredAt}
                  className="shrink-0 text-muted-foreground sm:text-right"
                >
                  {formatDateTime(entry.occurredAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
