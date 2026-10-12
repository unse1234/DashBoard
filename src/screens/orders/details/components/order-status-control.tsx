"use client"

import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { describeApiError } from "@/lib/api/api-error"
import { ORDER_STATUS_OPTIONS } from "@/constants/order.constants"
import type { OrderStatus, PaymentStatus } from "@/types/order.types"

function toOrderStatus(value: string | null) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === value)?.value
}

type OrderStatusControlProps = {
  orderId: string
  /** The order's current status. */
  status: OrderStatus
  /** What cancelling does depends on it: a paid order is recorded as refunded. */
  paymentStatus: PaymentStatus
  /**
   * Moves the order to the chosen status. If it rejects, the reason is shown:
   * as a message for a plain change, in the confirmation when cancelling.
   */
  onStatusChange: (status: OrderStatus) => Promise<void>
}

/**
 * Picks a status for an order and sends it on Update. Which statuses an order
 * may move to is for the API to decide, so every status is offered and a move
 * it refuses is reported with its reason. Cancelling is the one change that
 * asks first, because it returns the order's items to stock.
 *
 * It starts from the order's status, so the parent keys it by that status: a
 * change (made here or elsewhere) starts it again from the new one.
 */
export function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
  onStatusChange,
}: OrderStatusControlProps) {
  const [selected, setSelected] = useState(status)
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const selectId = useId()

  async function changeStatus() {
    setPending(true)
    try {
      await onStatusChange(selected)
    } finally {
      setPending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selected === "cancelled") {
      setConfirmOpen(true)
      return
    }

    try {
      await changeStatus()
    } catch (error) {
      toast.error(describeApiError(error))
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-center gap-2"
      >
        <Label htmlFor={selectId}>Change status</Label>
        <Select
          value={selected}
          items={ORDER_STATUS_OPTIONS}
          disabled={pending}
          onValueChange={(value) => {
            const next = toOrderStatus(value)
            if (next) setSelected(next)
          }}
        >
          <SelectTrigger id={selectId} className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={selected === status || pending}>
          {pending ? (
            <>
              <Spinner aria-hidden="true" />
              Updating…
            </>
          ) : (
            "Update"
          )}
        </Button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Cancel order ${orderId}?`}
        description={
          paymentStatus === "paid"
            ? "Its items go back into stock and the payment is recorded as refunded. Send the refund from your payment provider: the dashboard does not issue it."
            : "Its items go back into stock. A cancelled order can't be reopened."
        }
        confirmLabel="Yes, cancel order"
        pendingLabel="Cancelling…"
        destructive
        onConfirm={changeStatus}
      />
    </>
  )
}
