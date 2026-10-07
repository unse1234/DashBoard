import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

type CustomersTableToolbarProps = {
  search: string
  onSearchChange: (search: string) => void
}

export function CustomersTableToolbar({
  search,
  onSearchChange,
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
    </div>
  )
}
