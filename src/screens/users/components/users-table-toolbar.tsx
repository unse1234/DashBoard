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
import { USER_STATUS_FILTER_OPTIONS } from "@/lib/users/user.constants"
import type { UserStatusFilter } from "@/lib/users/user.types"

function toStatusFilter(value: string | null) {
  return USER_STATUS_FILTER_OPTIONS.find((option) => option.value === value)
    ?.value
}

type UsersTableToolbarProps = {
  search: string
  status: UserStatusFilter
  onSearchChange: (search: string) => void
  onStatusChange: (status: UserStatusFilter) => void
}

export function UsersTableToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: UsersTableToolbarProps) {
  return (
    <div role="search" className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="search"
          aria-label="Search users"
          placeholder="Search users..."
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </InputGroup>
      <Select
        value={status}
        items={USER_STATUS_FILTER_OPTIONS}
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
            {USER_STATUS_FILTER_OPTIONS.map((option) => (
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
