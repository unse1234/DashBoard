import Link from "next/link"

import { ProductActions } from "@/components/products/product-actions"
import { ProductStatusBadge } from "@/components/products/product-status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatInteger } from "@/lib/format-number"
import { getProductDisplayStatus } from "@/lib/products/product.utils"
import type { Product } from "@/lib/products/product.types"
import { getProductRoute } from "@/lib/routes"
import { cn } from "@/lib/utils"

const COLUMN_COUNT = 9

type ProductsTableProps = {
  products: Product[]
  selectedIds: ReadonlySet<string>
  onSelectProduct: (productId: string, selected: boolean) => void
  /** Selects or clears every product in `products`. */
  onSelectAll: (selected: boolean) => void
}

export function ProductsTable({
  products,
  selectedIds,
  onSelectProduct,
  onSelectAll,
}: ProductsTableProps) {
  const allSelected =
    products.length > 0 && products.every(({ id }) => selectedIds.has(id))
  const someSelected =
    !allSelected && products.some(({ id }) => selectedIds.has(id))

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-3">
              <Checkbox
                aria-label="Select all products"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={products.length === 0}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="sticky right-0 bg-muted text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                selected={selectedIds.has(product.id)}
                onSelectChange={(selected) =>
                  onSelectProduct(product.id, selected)
                }
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

type ProductRowProps = {
  product: Product
  selected: boolean
  onSelectChange: (selected: boolean) => void
}

function ProductRow({ product, selected, onSelectChange }: ProductRowProps) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="group/row [--row-tint:color-mix(in_oklab,var(--muted)_50%,var(--background))] hover:bg-(color:--row-tint) has-aria-expanded:bg-(color:--row-tint) data-[state=selected]:bg-(color:--row-tint)"
    >
      <TableCell className="pl-3">
        <Checkbox
          aria-label={`Select ${product.name}`}
          checked={selected}
          onCheckedChange={onSelectChange}
        />
      </TableCell>
      <TableCell className="font-medium">
        <Link
          href={getProductRoute(product.id)}
          title={product.name}
          className="block max-w-48 truncate underline-offset-4 hover:underline 2xl:max-w-64"
        >
          {product.name}
        </Link>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {product.sku}
      </TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>
        {product.brand ?? <span className="text-muted-foreground">Not set</span>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(product.price)}
      </TableCell>
      <TableCell
        className={cn(
          "text-right tabular-nums",
          product.stock === 0 && "text-destructive"
        )}
      >
        {formatInteger(product.stock)}
      </TableCell>
      <TableCell>
        <ProductStatusBadge status={getProductDisplayStatus(product)} />
      </TableCell>
      {/* Pinned so the menu stays reachable when the table scrolls sideways. It
          repeats the row's hover, menu-open and selected tint, which is opaque
          so the cell hides what scrolls under it. The tint is light enough for
          the muted text to keep its contrast. */}
      <TableCell className="sticky right-0 bg-background text-right group-hover/row:bg-(color:--row-tint) group-has-aria-expanded/row:bg-(color:--row-tint) group-data-[state=selected]/row:bg-(color:--row-tint)">
        <ProductActions product={product} />
      </TableCell>
    </TableRow>
  )
}
