import type { AuthUser } from "@/lib/auth/auth.types"
import { authenticatedRequest } from "@/lib/auth/authenticated-request"
import type { CreateUserValues, EditUserValues } from "@/lib/users/user.schemas"
import type { User, UsersQuery } from "@/lib/users/user.types"

type UserPageResponse = {
  data: AuthUser[]
  meta: { total: number }
}

type InviteUserResponse = {
  user: AuthUser
  /** False when the account was created but the email could not be sent. */
  invitationSent: boolean
}

export type UserPage = {
  users: User[]
  totalRecords: number
}

export type InvitedUser = {
  user: User
  invitationSent: boolean
}

export function toUser(apiUser: AuthUser): User {
  return {
    uid: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.isActive ? "active" : "inactive",
    createdAt: apiUser.createdAt,
    lastLoginAt: apiUser.lastLoginAt,
  }
}

export function buildUsersSearchParams({
  search,
  status,
  page,
  pageSize,
}: UsersQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search.trim()) params.set("search", search.trim())
  if (status !== "all") params.set("isActive", String(status === "active"))
  return params
}

function userPath(uid: string) {
  return `/users/${encodeURIComponent(uid)}`
}

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal
): Promise<UserPage> {
  const { data, meta } = await authenticatedRequest<UserPageResponse>(
    `/users?${buildUsersSearchParams(query)}`,
    { signal }
  )
  return { users: data.map(toUser), totalRecords: meta.total }
}

export async function getUser(uid: string, signal?: AbortSignal) {
  return toUser(await authenticatedRequest<AuthUser>(userPath(uid), { signal }))
}

/** Creates the account and emails the person a link to choose their password. */
export async function inviteUser(values: CreateUserValues): Promise<InvitedUser> {
  const { user, invitationSent } =
    await authenticatedRequest<InviteUserResponse>("/users", {
      method: "POST",
      body: values,
    })
  return { user: toUser(user), invitationSent }
}

export async function updateUser(
  uid: string,
  changes: Partial<EditUserValues>
) {
  return toUser(
    await authenticatedRequest<AuthUser>(userPath(uid), {
      method: "PATCH",
      body: changes,
    })
  )
}
