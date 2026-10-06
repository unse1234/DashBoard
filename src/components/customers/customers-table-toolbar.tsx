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
import { CUSTOMER_STATUS_FILTER_OPTIONS } from "@/lib/customers/customer.constants"
import type { CustomerStatusFilter } from "@/lib/customers/customer.types"

function toStatusFilter(value: string | null) {
  return CUSTOMER_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

type CustomersTableToolbarProps = {
  search: string
  status: CustomerStatusFilter
  onSearchChange: (search: string) => void
  onStatusChange: (status: CustomerStatusFilter) => void
}

export function CustomersTableToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: CustomersTableToolbarProps) {
  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search customers by ID, name, email or phone"
          placeholder="Search by name, email, phone or ID..."
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </InputGroup>
      <Select
        value={status}
        items={CUSTOMER_STATUS_FILTER_OPTIONS}
        onValueChange={(value) => {
          const next = toStatusFilter(value)
          if (next) onStatusChange(next)
        }}
      >
        <SelectTrigger
          aria-label="Filter by status"
          className="w-full sm:w-44"
        >
          <span className="text-muted-foreground">Status:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {CUSTOMER_STATUS_FILTER_OPTIONS.map((option) => (
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
