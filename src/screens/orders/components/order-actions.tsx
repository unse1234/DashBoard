import Link from "next/link"
import { EllipsisVerticalIcon, EyeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { OrderListItem } from "@/types/order.types"
import { getOrderRoute } from "@/config/routes"

type OrderActionsProps = {
  order: Pick<OrderListItem, "id">
}

export function OrderActions({ order }: OrderActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for order ${order.id}`}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={getOrderRoute(order.id)} />}>
          <EyeIcon />
          View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
