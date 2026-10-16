"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import type { Order, PaymentMethod } from "@/types/order.types"
import { formatCurrency } from "@/utils/format-number"

type OrderPaymentControlProps = {
  orderId: string
  /** The amount the payment should be, in `currency`. */
  total: number
  currency: Order["currency"]
  /** How the order is paid for; null on orders that predate payment methods. */
  method: PaymentMethod | null
  /** Records the payment. The confirmation shows the reason if it rejects. */
  onMarkPaid: () => Promise<void>
}

/**
 * For orders paid outside the dashboard (cash on delivery, a bank transfer):
 * the dashboard takes no payments itself, so staff record that one arrived.
 * Shown only while that is possible. For cash on delivery it is worded as what
 * it is: the cash the courier collected.
 */
export function OrderPaymentControl({
  orderId,
  total,
  currency,
  method,
  onMarkPaid,
}: OrderPaymentControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const amount = formatCurrency(total, currency)
  const isCashOnDelivery = method === "cod"

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
      >
        {isCashOnDelivery ? "Record cash payment" : "Mark as paid"}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          isCashOnDelivery
            ? `Record the cash payment for order ${orderId}?`
            : `Mark order ${orderId} as paid?`
        }
        description={
          isCashOnDelivery
            ? `This records that ${amount} was collected in cash on delivery. The dashboard doesn't take payments itself.`
            : `This records that the payment of ${amount} was received. The dashboard doesn't take payments itself.`
        }
        confirmLabel={isCashOnDelivery ? "Record payment" : "Mark as paid"}
        pendingLabel="Saving…"
        onConfirm={onMarkPaid}
      />
    </>
  )
}
