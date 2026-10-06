import Link from "next/link"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  Customer,
  CustomerStatus,
} from "@/lib/customers/customer.types"
import { getToggledStatus } from "@/lib/customers/customer.utils"
import { getCustomerRoute } from "@/lib/routes"

type CustomerActionsProps = {
  customer: Customer
  onStatusChange: (customer: Customer, status: CustomerStatus) => void
}

export function CustomerActions({
  customer,
  onStatusChange,
}: CustomerActionsProps) {
  const isActive = customer.status === "active"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${customer.name}`}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={getCustomerRoute(customer.id)} />}>
          <EyeIcon />
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            onStatusChange(customer, getToggledStatus(customer.status))
          }
        >
          {isActive ? <UserRoundXIcon /> : <UserRoundCheckIcon />}
          {isActive ? "Disable" : "Enable"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
