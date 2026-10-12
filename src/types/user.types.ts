import type { z } from "zod"
import type { createUserSchema, profileSchema, editUserSchema } from "@/validations/user.schemas"

import type { PageSize } from "@/types/pagination.types";
import type { UserRole } from "@/types/auth.types"

export type { UserRole }

export type UserStatus = "active" | "inactive"

export type User = {
  /** Public identifier, also used in the details route. */
  uid: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  /** ISO 8601 timestamps; `lastLoginAt` is null until the first login. */
  createdAt: string
  lastLoginAt: string | null
}

export type UserStatusFilter = UserStatus | "all"

/**
 * Everything that decides which users are listed; sent to the API as query
 * parameters. The API always returns the newest users first.
 */
export type UsersQuery = {
  search: string
  status: UserStatusFilter
  page: number
  pageSize: PageSize
}

export type CreateUserValues = z.infer<typeof createUserSchema>

export type ProfileValues = z.infer<typeof profileSchema>

export type EditUserValues = z.infer<typeof editUserSchema>

export type UserPage = {
  users: User[]
  totalRecords: number
}

export type InvitedUser = {
  user: User
  invitationSent: boolean
}
