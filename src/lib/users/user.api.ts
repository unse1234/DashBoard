import type { UserPage, InvitedUser } from "@/types/user.types"
import { apiClient } from "@/lib/api/axios"
import type { AuthUser } from "@/types/auth.types"
import type { CreateUserValues, EditUserValues, ProfileValues } from "@/types/user.types";
import type { User, UsersQuery } from "@/types/user.types"

type UserPageResponse = {
  data: AuthUser[]
  meta: { total: number }
}

type InviteUserResponse = {
  user: AuthUser
  /** False when the account was created but the email could not be sent. */
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

// All of these need a signed-in user; the API client attaches the token.

export async function listUsers(
  query: UsersQuery,
  signal?: AbortSignal
): Promise<UserPage> {
  const { data } = await apiClient.get<UserPageResponse>("/users", {
    params: buildUsersSearchParams(query),
    signal,
  })
  return { users: data.data.map(toUser), totalRecords: data.meta.total }
}

export async function getUser(uid: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<AuthUser>(userPath(uid), { signal })
  return toUser(data)
}

/** Creates the account and emails the person a link to choose their password. */
export async function inviteUser(
  values: CreateUserValues
): Promise<InvitedUser> {
  const { data } = await apiClient.post<InviteUserResponse>("/users", values)
  return { user: toUser(data.user), invitationSent: data.invitationSent }
}

/** Name, role and status in one atomic request; send only what changed. */
export async function updateUser(
  uid: string,
  changes: Partial<EditUserValues>
) {
  const { data } = await apiClient.patch<AuthUser>(userPath(uid), changes)
  return toUser(data)
}

/** Disabling also ends all of the user's sessions. The API refuses it for your own account. */
export async function setUserActive(uid: string, isActive: boolean) {
  const { data } = await apiClient.patch<AuthUser>(`${userPath(uid)}/active`, {
    isActive,
  })
  return toUser(data)
}

/** A soft delete: the account disappears from the API and can no longer sign in. */
export async function deleteUser(uid: string) {
  await apiClient.delete(userPath(uid))
}

/** The signed-in user's own account; only the name can be changed. */
export async function updateProfile(values: ProfileValues) {
  const { data } = await apiClient.patch<AuthUser>("/users/me", values)
  return toUser(data)
}
