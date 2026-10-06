import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/lib/orders/order.constants"
import type {
  Order,
  OrderAddress,
  OrderStatus,
} from "@/lib/orders/order.types"

/** Units across all lines, so two bottles and a notebook count as three items. */
export function getOrderItemCount({ items }: Pick<Order, "items">) {
  return items.reduce((count, item) => count + item.quantity, 0)
}

/**
 * The statuses an order can be set to: where it is now, any stage after it, and
 * cancelled. Orders only move forward, and a delivered or cancelled order is
 * final.
 */
export function getAvailableOrderStatuses(current: OrderStatus): OrderStatus[] {
  if (current === "delivered" || current === "cancelled") return [current]

  return ORDER_STATUSES.slice(ORDER_STATUSES.indexOf(current))
}

export function getStatusChangeMessage(orderId: string, status: OrderStatus) {
  return `Order ${orderId} is now ${ORDER_STATUS_LABELS[status].toLowerCase()}.`
}

/**
 * The lines of an address below the recipient: the street, the city line and
 * the country. Lines that are not set are left out.
 */
export function getOrderAddressLines({
  addressLine1,
  addressLine2,
  city,
  region,
  postalCode,
  country,
}: Omit<OrderAddress, "recipientName" | "phone">) {
  const place = [city, region].filter(Boolean).join(", ")
  const cityLine = [place, postalCode].filter(Boolean).join(" ")

  return [addressLine1, addressLine2, cityLine, country].filter(
    (line): line is string => Boolean(line)
  )
}
