import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

type UserFormFooterProps = {
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
}

export function UserFormFooter({
  isSubmitting,
  submitLabel,
  submittingLabel,
}: UserFormFooterProps) {
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
