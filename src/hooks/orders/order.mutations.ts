import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { customerKeys } from "@/hooks/customers/customer.keys"
import { markOrderPaid, updateOrderStatus } from "@/services/orders/order.api"
import { orderKeys } from "@/hooks/orders/order.keys"
import type { Order, OrderStatus } from "@/types/order.types"
import { productKeys } from "@/hooks/products/product.keys"

// What an order change touches:
// - the order itself, which the API returns whole, so its detail entry is
//   replaced outright rather than refetched;
// - every list it can appear in (status and payment filters, sorting), which
//   refetch without being awaited, so the screen keeps its rows, dimmed, until
//   the fresh page arrives.
// A status change also reaches beyond orders. A customer's statistics and
// recent orders count it, and a cancellation puts the items back into stock.
// The API sets the order's final state, so nothing here guesses it.

function cacheChangedOrder(queryClient: QueryClient, order: Order) {
  queryClient.setQueryData(orderKeys.detail(order.id), order)
  void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string
      status: OrderStatus
    }) => updateOrderStatus(orderId, status),
    onSuccess: (order) => {
      cacheChangedOrder(queryClient, order)
      void queryClient.invalidateQueries({ queryKey: customerKeys.all })
      if (order.status === "cancelled") {
        void queryClient.invalidateQueries({ queryKey: productKeys.all })
      }
    },
  })
}

export function useMarkOrderPaidMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => markOrderPaid(orderId),
    onSuccess: (order) => cacheChangedOrder(queryClient, order),
  })
}
