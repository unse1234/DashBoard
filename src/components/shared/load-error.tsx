import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { describeApiError } from "@/lib/api/api-error"

type LoadErrorProps = {
  /** What could not be loaded, e.g. "users". */
  resourceName: string
  error: unknown
  onRetry: () => void
}

/** Shown in place of content that failed to load, with a way to try again. */
export function LoadError({ resourceName, error, onRetry }: LoadErrorProps) {
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Couldn&apos;t load {resourceName}</AlertTitle>
      <AlertDescription>
        <p>{describeApiError(error)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
