import { vi } from "vitest"

import { authenticatedRequest } from "@/lib/auth/authenticated-request"
import {
  buildUsersSearchParams,
  getUser,
  inviteUser,
  listUsers,
  toUser,
  updateUser,
} from "@/lib/users/user.api"
import { defaultUsersQuery } from "@/lib/users/user.query"
import { createAuthUser } from "@/test-utils/auth-fixtures"

vi.mock("@/lib/auth/authenticated-request")

const request = vi.mocked(authenticatedRequest)

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
  beforeEach(() => {
    request.mockReset()
  })

  it("lists a page of users with the total", async () => {
    request.mockResolvedValue({
      data: [createAuthUser({ id: "1" }), createAuthUser({ id: "2" })],
      meta: { page: 1, pageSize: 10, total: 42, totalPages: 5 },
    })
    const signal = new AbortController().signal

    const page = await listUsers(defaultUsersQuery, signal)

    expect(request).toHaveBeenCalledWith("/users?page=1&pageSize=10", { signal })
    expect(page.totalRecords).toBe(42)
    expect(page.users.map((user) => user.uid)).toEqual(["1", "2"])
  })

  it("fetches one user, encoding the id into the path", async () => {
    request.mockResolvedValue(createAuthUser({ id: "a/b" }))

    const user = await getUser("a/b")

    expect(request).toHaveBeenCalledWith("/users/a%2Fb", { signal: undefined })
    expect(user.uid).toBe("a/b")
  })

  it("invites a user and reports whether the email went out", async () => {
    request.mockResolvedValue({
      user: createAuthUser({ id: "new", role: "STAFF" }),
      invitationSent: false,
    })

    const result = await inviteUser({
      name: "Sam",
      email: "sam@example.com",
      role: "STAFF",
    })

    expect(request).toHaveBeenCalledWith("/users", {
      method: "POST",
      body: { name: "Sam", email: "sam@example.com", role: "STAFF" },
    })
    expect(result).toMatchObject({
      invitationSent: false,
      user: { uid: "new", role: "STAFF" },
    })
  })

  it("sends only the changed fields when updating", async () => {
    request.mockResolvedValue(createAuthUser({ id: "u1", isActive: false }))

    const user = await updateUser("u1", { isActive: false })

    expect(request).toHaveBeenCalledWith("/users/u1", {
      method: "PATCH",
      body: { isActive: false },
    })
    expect(user.status).toBe("inactive")
  })
})
