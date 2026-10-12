const KILOBYTE = 1024
const MEGABYTE = KILOBYTE * 1024

const decimalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

/** "512 B", "48.3 KB", "10 MB". */
export function formatFileSize(bytes: number) {
  if (bytes < KILOBYTE) return `${bytes} B`
  if (bytes < MEGABYTE) return `${decimalFormatter.format(bytes / KILOBYTE)} KB`
  return `${decimalFormatter.format(bytes / MEGABYTE)} MB`
}
