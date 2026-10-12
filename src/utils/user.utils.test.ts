import { getChangedFields } from "@/utils/user.utils"
import { createUser } from "@/test-utils/user-fixtures"

const user = createUser({ name: "Ada", role: "STAFF", status: "active" })
const unchanged = { name: "Ada", role: "STAFF", isActive: true } as const

describe("getChangedFields", () => {
  it("is empty when nothing changed", () => {
    expect(getChangedFields(user, unchanged)).toEqual({})
  })

  it("returns only the fields that differ", () => {
    expect(getChangedFields(user, { ...unchanged, name: "Ada King" })).toEqual({
      name: "Ada King",
    })
    expect(getChangedFields(user, { ...unchanged, role: "ADMIN" })).toEqual({
      role: "ADMIN",
    })
    expect(getChangedFields(user, { ...unchanged, isActive: false })).toEqual({
      isActive: false,
    })
  })

  it("compares status against the user's current one", () => {
    const inactive = createUser({ status: "inactive" })

    expect(
      getChangedFields(inactive, {
        ...unchanged,
        name: inactive.name,
        role: inactive.role,
        isActive: true,
      })
    ).toEqual({
      isActive: true,
    })
  })

  it("can return several changes at once", () => {
    expect(
      getChangedFields(user, { name: "New", role: "ADMIN", isActive: false })
    ).toEqual({ name: "New", role: "ADMIN", isActive: false })
  })
})
