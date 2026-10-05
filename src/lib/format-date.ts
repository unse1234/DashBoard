// Formatted in UTC so the server and the browser render identical text,
// whatever time zone each runs in (otherwise hydration would mismatch).
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate))
}

export function formatDateTime(isoDate: string) {
  return `${dateTimeFormatter.format(new Date(isoDate))} UTC`
}
