"use client"

import { useId, useState, type FormEvent } from "react"

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
import { ORDER_STATUS_LABELS } from "@/lib/orders/order.constants"
import type { OrderStatus } from "@/lib/orders/order.types"
import { getAvailableOrderStatuses } from "@/lib/orders/order.utils"

type OrderStatusControlProps = {
  /** The order's current status. */
  status: OrderStatus
  /** Called with the chosen status when the admin presses Update. */
  onStatusChange: (status: OrderStatus) => void
}

/**
 * Picks the next status for an order and applies it on Update. It only offers
 * the statuses `getAvailableOrderStatuses` allows, so an order can't move
 * backwards or leave a final status.
 */
export function OrderStatusControl({
  status,
  onStatusChange,
}: OrderStatusControlProps) {
  const [selected, setSelected] = useState(status)
  const selectId = useId()
  const hintId = useId()

  const options = getAvailableOrderStatuses(status).map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  }))
  const isFinal = options.length === 1

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selected !== status) onStatusChange(selected)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-1.5 sm:items-end"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={selectId}>Change status</Label>
        <Select
          value={selected}
          items={options}
          disabled={isFinal}
          onValueChange={(value) => {
            const next = options.find((option) => option.value === value)
            if (next) setSelected(next.value)
          }}
        >
          <SelectTrigger
            id={selectId}
            className="w-40"
            aria-describedby={isFinal ? hintId : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
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
      </div>
      {isFinal && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {ORDER_STATUS_LABELS[status]} orders can&apos;t be changed.
        </p>
      )}
    </form>
  )
}
