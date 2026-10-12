import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ALL_CATEGORIES,
  PRODUCT_STATUS_FILTER_OPTIONS,
} from "@/lib/products/product.constants"
import type {
  Category,
  ProductStatusFilter,
} from "@/lib/products/product.types"

function toStatusFilter(value: string | null) {
  return PRODUCT_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

type ProductsTableToolbarProps = {
  search: string
  /** A category's identifier, or "all". */
  category: string
  status: ProductStatusFilter
  /** The categories to filter by; empty until they have loaded. */
  categories: Category[]
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onStatusChange: (status: ProductStatusFilter) => void
}

export function ProductsTableToolbar({
  search,
  category,
  status,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: ProductsTableToolbarProps) {
  const categoryOptions = [
    { value: ALL_CATEGORIES, label: "All Categories" },
    ...categories.map(({ id, name }) => ({ value: id, label: name })),
  ]

  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search products by name or SKU"
          placeholder="Search by name or SKU..."
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </InputGroup>
      <Select
        value={category}
        items={categoryOptions}
        onValueChange={(value) => {
          const next = categoryOptions.find((option) => option.value === value)
          if (next) onCategoryChange(next.value)
        }}
      >
        <SelectTrigger
          aria-label="Filter by category"
          className="w-full sm:w-48"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={status}
        items={PRODUCT_STATUS_FILTER_OPTIONS}
        onValueChange={(value) => {
          const next = toStatusFilter(value)
          if (next) onStatusChange(next)
        }}
      >
        <SelectTrigger aria-label="Filter by status" className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
