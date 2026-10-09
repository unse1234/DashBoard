import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

type DialogFormFooterProps = {
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
}

export function DialogFormFooter({
  isSubmitting,
  submitLabel,
  submittingLabel,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      <DialogClose render={<Button type="button" variant="outline" />}>
        Cancel
      </DialogClose>
      <Button type="submit">
        {isSubmitting ? (
          <>
            <Spinner aria-hidden="true" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </DialogFooter>
  )
}
