import type {
  User,
  UserRole,
  UserStatus,
  UserStatusFilter,
} from "@/lib/users/user.types"

export const USER_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
} as const satisfies Record<UserStatus, string>

export const USER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: USER_STATUS_LABELS.active },
  { value: "inactive", label: USER_STATUS_LABELS.inactive },
] as const satisfies readonly { value: UserStatusFilter; label: string }[]

export const USER_ROLE_LABELS = {
  ADMIN: "Admin",
  STAFF: "Staff",
} as const satisfies Record<UserRole, string>

export const USER_ROLE_OPTIONS = [
  { value: "STAFF", label: USER_ROLE_LABELS.STAFF },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
] as const satisfies readonly { value: UserRole; label: string }[]

export const USER_COLUMNS = [
  { id: "uid", label: "UID" },
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "role", label: "Role" },
  { id: "status", label: "Status" },
  { id: "createdAt", label: "Created At" },
  { id: "lastLoginAt", label: "Last Login" },
] as const satisfies readonly { id: keyof User; label: string }[]
