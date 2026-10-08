import { createElement } from "react"

import type { NavItem } from "@/components/dashboard/nav.types"
import { getVisibleNavItems } from "@/components/dashboard/nav.utils"

const icon = createElement("span")
const items: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon },
  { title: "Users", url: "/dashboard/users", icon, requiredRole: "ADMIN" },
]

describe("getVisibleNavItems", () => {
  it("shows admin-only items to admins", () => {
    expect(getVisibleNavItems(items, "ADMIN").map((i) => i.title)).toEqual([
      "Dashboard",
      "Users",
    ])
  })

  it("hides them from staff and from an unknown role", () => {
    expect(getVisibleNavItems(items, "STAFF").map((i) => i.title)).toEqual([
      "Dashboard",
    ])
    expect(getVisibleNavItems(items, undefined).map((i) => i.title)).toEqual([
      "Dashboard",
    ])
  })
})
