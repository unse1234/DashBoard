import Link from "next/link"
import { EllipsisVerticalIcon, EyeIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getEditProductRoute, getProductRoute } from "@/lib/routes"
import type { Product } from "@/lib/products/product.types"

type ProductActionsProps = {
  product: Product
}

export function ProductActions({ product }: ProductActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${product.name}`}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={getProductRoute(product.id)} />}>
          <EyeIcon />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={getEditProductRoute(product.id)} />}
        >
          <PencilIcon />
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
