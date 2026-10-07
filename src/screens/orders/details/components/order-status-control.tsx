"use client"

import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"

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
import { ORDER_STATUS_OPTIONS } from "@/lib/orders/order.constants"
import type { OrderStatus } from "@/lib/orders/order.types"

function toOrderStatus(value: string | null) {
  return ORDER_STATUS_OPTIONS.find((option) => option.value === value)?.value
}

function showNotConnectedNotice() {
  toast.info("Not available yet", {
    description: "Status updates will work once the orders API is connected.",
  })
}

type OrderStatusControlProps = {
  /** The order's current status. */
  status: OrderStatus
  /**
   * The status mutation. Until the orders API exists, leaving it out shows a
   * notice instead of pretending the status changed.
   */
  onStatusChange?: (status: OrderStatus) => void
}

/**
 * Picks a status for an order and sends it on Update. Which statuses an order
 * may move to is for the API to decide, so every status is offered.
 */
export function OrderStatusControl({
  status,
  onStatusChange,
}: OrderStatusControlProps) {
  const [selected, setSelected] = useState(status)
  const selectId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (onStatusChange) {
      onStatusChange(selected)
    } else {
      showNotConnectedNotice()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2"
    >
      <Label htmlFor={selectId}>Change status</Label>
      <Select
        value={selected}
        items={ORDER_STATUS_OPTIONS}
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
      <Button type="submit" disabled={selected === status}>
        Update
      </Button>
    </form>
  )
}
