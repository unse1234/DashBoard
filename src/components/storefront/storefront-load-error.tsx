import { Button } from "@/components/ui/button"
import { describeApiError } from "@/lib/api/api-error"

type StorefrontLoadErrorProps = {
  /** What could not be loaded, e.g. "products". */
  resourceName: string
  error: unknown
  onRetry: () => void
}

/** Shown in place of storefront content that failed to load, with a way to try again. */
export function StorefrontLoadError({
  resourceName,
  error,
  onRetry,
}: StorefrontLoadErrorProps) {
  return (
    <div
      role="alert"
      className="mt-16 flex flex-col items-center gap-3 text-center"
    >
      <p className="text-xl font-medium">Couldn’t load {resourceName}.</p>
      <p className="text-base text-store-muted">{describeApiError(error)}</p>
      <Button
        type="button"
        onClick={onRetry}
        className="mt-2 h-11 rounded-store-sm border-0 bg-store-ink px-6 text-base font-medium text-white hover:bg-store-ink/85 focus-visible:ring-store-ink/40"
      >
        Try again
      </Button>
    </div>
  )
}
