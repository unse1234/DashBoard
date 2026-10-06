import Link from "next/link"
import { EllipsisVerticalIcon, EyeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Customer } from "@/lib/customers/customer.types"
import { getCustomerRoute } from "@/lib/routes"

type CustomerActionsProps = {
  customer: Customer
}

export function CustomerActions({ customer }: CustomerActionsProps) {
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
