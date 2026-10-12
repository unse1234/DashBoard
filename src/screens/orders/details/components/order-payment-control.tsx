"use client"

import { useState } from "react"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format-number"

type OrderPaymentControlProps = {
  orderId: string
  /** The amount the payment should be, in USD. */
  total: number
  /** Records the payment. The confirmation shows the reason if it rejects. */
  onMarkPaid: () => Promise<void>
}

/**
 * For orders paid outside the dashboard (cash on delivery, a bank transfer):
 * the dashboard takes no payments itself, so staff record that one arrived.
 * Shown only while that is possible.
 */
export function OrderPaymentControl({
  orderId,
  total,
  onMarkPaid,
}: OrderPaymentControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
      >
        Mark as paid
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Mark order ${orderId} as paid?`}
        description={`This records that the payment of ${formatCurrency(total)} was received. The dashboard doesn't take payments itself.`}
        confirmLabel="Mark as paid"
        pendingLabel="Saving…"
        onConfirm={onMarkPaid}
      />
    </>
  )
}
