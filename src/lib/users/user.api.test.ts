import { vi } from "vitest"

import { attachSessionHandlers } from "@/lib/api/axios"
import {
  buildUsersSearchParams,
  deleteUser,
  getUser,
  inviteUser,
  listUsers,
  setUserActive,
  toUser,
  updateProfile,
  updateUser,
} from "@/lib/users/user.api"
import { defaultUsersQuery } from "@/lib/users/user.query"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { mockApi } from "@/test-utils/mock-api"

describe("toUser", () => {
  it("maps the API account to the table model", () => {
    const user = toUser(
      createAuthUser({
        id: "abc",
        role: "STAFF",
        isActive: false,
        lastLoginAt: null,
      })
    )

    expect(user).toEqual({
      uid: "abc",
      name: "Ada Admin",
      email: "ada@example.com",
      role: "STAFF",
      status: "inactive",
      createdAt: "2026-01-01T00:00:00Z",
      lastLoginAt: null,
    })
  })
})

describe("buildUsersSearchParams", () => {
  it("always sends the page and page size", () => {
    expect(buildUsersSearchParams(defaultUsersQuery).toString()).toBe(
      "page=1&pageSize=10"
    )
  })

  it("adds a trimmed search and maps the status filter to isActive", () => {
    const params = buildUsersSearchParams({
      ...defaultUsersQuery,
      search: "  ada & co ",
      status: "inactive",
      page: 3,
      pageSize: 50,
    })

    expect(params.get("search")).toBe("ada & co")
    expect(params.get("isActive")).toBe("false")
    expect(params.get("page")).toBe("3")
    expect(params.get("pageSize")).toBe("50")
    // The ampersand is encoded, not treated as a separator.
    expect(params.toString()).toContain("search=ada+%26+co")
  })

  it("maps the active filter and omits blank searches", () => {
    const params = buildUsersSearchParams({
      ...defaultUsersQuery,
      search: "   ",
      status: "active",
    })

    expect(params.get("isActive")).toBe("true")
    expect(params.has("search")).toBe(false)
  })
})

describe("users API calls", () => {
  let api: ReturnType<typeof mockApi>

  beforeEach(() => {
    attachSessionHandlers({
      getAccessToken: vi.fn().mockResolvedValue("token-1"),
      refreshSession: vi.fn().mockResolvedValue(false),
      clearSession: vi.fn(),
    })
  })

  afterEach(() => {
    api.restore()
  })

  it("lists a page of users with the total, as an authenticated GET", async () => {
    api = mockApi(() => ({
      data: {
        data: [createAuthUser({ id: "1" }), createAuthUser({ id: "2" })],
        meta: { page: 1, pageSize: 10, total: 42, totalPages: 5 },
      },
    }))
    const signal = new AbortController().signal

    const page = await listUsers(defaultUsersQuery, signal)

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/users",
      signal,
    })
    expect(String(api.requests[0].params)).toBe("page=1&pageSize=10")
    expect(api.requests[0].headers.authorization).toBe("Bearer token-1")
    expect(page.totalRecords).toBe(42)
    expect(page.users.map((user) => user.uid)).toEqual(["1", "2"])
  })

  it("fetches one user, encoding the id into the path", async () => {
    api = mockApi(() => ({ data: createAuthUser({ id: "a/b" }) }))

    const user = await getUser("a/b")

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/users/a%2Fb",
    })
    expect(user.uid).toBe("a/b")
  })

  it("invites a user and reports whether the email went out", async () => {
    api = mockApi(() => ({
      status: 201,
      data: {
        user: createAuthUser({ id: "new", role: "STAFF" }),
        invitationSent: false,
      },
    }))

    const result = await inviteUser({
      name: "Sam",
      email: "sam@example.com",
      role: "STAFF",
    })

    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/users",
      body: { name: "Sam", email: "sam@example.com", role: "STAFF" },
    })
    expect(result).toMatchObject({
      invitationSent: false,
      user: { uid: "new", role: "STAFF" },
    })
  })

  it("sends only the changed fields when updating", async () => {
    api = mockApi(() => ({ data: createAuthUser({ id: "u1", role: "ADMIN" }) }))

    const user = await updateUser("u1", { role: "ADMIN" })

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/users/u1",
      body: { role: "ADMIN" },
    })
    expect(user.role).toBe("ADMIN")
  })

  it("changes status through the dedicated endpoint", async () => {
    api = mockApi(() => ({
      data: createAuthUser({ id: "u1", isActive: false }),
    }))

    const user = await setUserActive("u1", false)

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/users/u1/active",
      body: { isActive: false },
    })
    expect(user.status).toBe("inactive")
  })

  it("deletes a user and resolves with nothing for the 204", async () => {
    api = mockApi(() => ({ status: 204 }))

    await expect(deleteUser("u1")).resolves.toBeUndefined()

    expect(api.requests[0]).toMatchObject({
      method: "DELETE",
      url: "/users/u1",
    })
  })

  it("updates the signed-in user's own profile", async () => {
    api = mockApi(() => ({ data: createAuthUser({ name: "Ada King" }) }))

    const user = await updateProfile({ name: "Ada King" })

    expect(api.requests[0]).toMatchObject({
      method: "PATCH",
      url: "/users/me",
      body: { name: "Ada King" },
    })
    expect(user.name).toBe("Ada King")
  })

  it("passes the API's validation messages through", async () => {
    api = mockApi(() => ({
      status: 400,
      data: { statusCode: 400, message: ["name must be shorter"] },
    }))

    await expect(updateProfile({ name: "x" })).rejects.toMatchObject({
      status: 400,
      messages: ["name must be shorter"],
    })
  })
})
