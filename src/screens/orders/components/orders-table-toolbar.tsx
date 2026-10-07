import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORDER_STATUS_FILTER_OPTIONS,
  PAYMENT_STATUS_FILTER_OPTIONS,
} from "@/lib/orders/order.constants"
import type {
  OrderStatusFilter,
  PaymentStatusFilter,
} from "@/lib/orders/order.types"

function toOrderStatusFilter(value: string | null) {
  return ORDER_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

function toPaymentStatusFilter(value: string | null) {
  return PAYMENT_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

type OrdersTableToolbarProps = {
  search: string
  status: OrderStatusFilter
  paymentStatus: PaymentStatusFilter
  onSearchChange: (search: string) => void
  onStatusChange: (status: OrderStatusFilter) => void
  onPaymentStatusChange: (paymentStatus: PaymentStatusFilter) => void
}

export function OrdersTableToolbar({
  search,
  status,
  paymentStatus,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
}: OrdersTableToolbarProps) {
  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search orders by order ID, customer name or email"
          placeholder="Search by order ID, name or email..."
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </InputGroup>
      <Select
        value={status}
        items={ORDER_STATUS_FILTER_OPTIONS}
        onValueChange={(value) => {
          const next = toOrderStatusFilter(value)
          if (next) onStatusChange(next)
        }}
      >
        <SelectTrigger
          aria-label="Filter by order status"
          className="w-full sm:w-48"
        >
          <span className="text-muted-foreground">Status:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={paymentStatus}
        items={PAYMENT_STATUS_FILTER_OPTIONS}
        onValueChange={(value) => {
          const next = toPaymentStatusFilter(value)
          if (next) onPaymentStatusChange(next)
        }}
      >
        <SelectTrigger
          aria-label="Filter by payment status"
          className="w-full sm:w-48"
        >
          <span className="text-muted-foreground">Payment:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PAYMENT_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
