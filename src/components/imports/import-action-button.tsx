"use client"

import type { ComponentProps } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

function showNotConnectedNotice() {
  toast.info("Not available yet", {
    description: "This action will work once the imports API is connected.",
  })
}

type ImportActionButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  /**
   * The mutation or download to run. Until the imports API exists, leaving it
   * out shows a notice instead of pretending the action happened.
   */
  onAction?: () => void | Promise<void>
}

/** Every import action that needs the backend goes through here. */
export function ImportActionButton({
  onAction,
  ...buttonProps
}: ImportActionButtonProps) {
  return (
    <Button
      type="button"
      onClick={onAction ?? showNotConnectedNotice}
      {...buttonProps}
    />
  )
}
