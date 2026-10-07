import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import type { ImportTimelineEvent } from "@/lib/imports/import.types"
import { cn } from "@/lib/utils"

const markerClasses = {
  done: "bg-primary",
  pending: "bg-border",
  failed: "bg-destructive",
} as const satisfies Record<ImportTimelineEvent["state"], string>

type ImportTimelineProps = {
  events: ImportTimelineEvent[]
}

export function ImportTimeline({ events }: ImportTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Timeline</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="ml-1 border-l">
          {events.map((event) => (
            <li
              key={event.id}
              className="relative flex flex-col gap-0.5 pb-5 pl-5 last:pb-0"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1.5 -left-1 size-2 rounded-full",
                  markerClasses[event.state]
                )}
              />
              <p
                className={cn(
                  "font-medium",
                  event.state === "pending" && "text-muted-foreground"
                )}
              >
                {event.label}
              </p>
              {event.timestamp ? (
                <time dateTime={event.timestamp} className="text-muted-foreground">
                  {formatDateTime(event.timestamp)}
                </time>
              ) : (
                <p className="text-muted-foreground">Pending</p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
