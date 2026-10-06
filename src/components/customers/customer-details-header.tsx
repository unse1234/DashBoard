"use client"

import { useState } from "react"
import { UserRoundCheckIcon, UserRoundXIcon } from "lucide-react"
import { toast } from "sonner"

import { CustomerStatusBadge } from "@/components/customers/customer-status-badge"
import { Button } from "@/components/ui/button"
import type { Customer } from "@/lib/customers/customer.types"
import {
  getStatusChangeMessage,
  getToggledStatus,
} from "@/lib/customers/customer.utils"

type CustomerDetailsHeaderProps = {
  customer: Customer
}

/**
 * Enable / Disable only changes this header's own copy of the status until the
 * API exists; with it, the page gets the new status back from the server.
 */
export function CustomerDetailsHeader({
  customer,
}: CustomerDetailsHeaderProps) {
  const [status, setStatus] = useState(customer.status)
  const isActive = status === "active"

  function toggleStatus() {
    const nextStatus = getToggledStatus(status)
    setStatus(nextStatus)
    toast.success(getStatusChangeMessage(customer.name, nextStatus))
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h2 className="text-xl font-medium wrap-anywhere">{customer.name}</h2>
          <CustomerStatusBadge status={status} />
        </div>
        <p className="text-muted-foreground">
          Customer ID: <span className="font-mono text-xs">{customer.id}</span>
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-fit shrink-0"
        onClick={toggleStatus}
      >
        {isActive ? (
          <UserRoundXIcon aria-hidden="true" />
        ) : (
          <UserRoundCheckIcon aria-hidden="true" />
        )}
        {isActive ? "Disable customer" : "Enable customer"}
      </Button>
    </div>
  )
}
