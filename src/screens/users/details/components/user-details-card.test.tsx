import { render, screen, within } from "@testing-library/react"

import { UserDetailsCard } from "@/screens/users/details/components/user-details-card"
import { createUser } from "@/test-utils/user-fixtures"

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

describe("UserDetailsCard", () => {
  it("shows every available detail with its label", () => {
    const user = createUser({
      uid: "6f1c2d3e-0000-4000-8000-000000000001",
      name: "Alexandria Montgomery-Fitzgerald",
      role: "ADMIN",
      createdAt: "2025-01-27T08:05:00Z",
      lastLoginAt: "2026-09-28T11:48:00Z",
    })
    render(<UserDetailsCard user={user} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Account details" })
    ).toBeInTheDocument()
    expect(getValue("UID")).toHaveTextContent(user.uid)
    expect(getValue("Name")).toHaveTextContent(
      "Alexandria Montgomery-Fitzgerald"
    )
    expect(getValue("Email")).toHaveTextContent(user.email)
    expect(getValue("Role")).toHaveTextContent("Admin")
    expect(within(getValue("Status")).getByText("Active")).toBeInTheDocument()
    expect(getValue("Created At")).toHaveTextContent("Jan 27, 2025, 8:05 AM UTC")
    expect(getValue("Last Login")).toHaveTextContent("Sep 28, 2026, 11:48 AM UTC")
  })

  it("shows the inactive status and a missing login", () => {
    render(
      <UserDetailsCard
        user={createUser({ status: "inactive", lastLoginAt: null, role: "STAFF" })}
      />
    )

    expect(getValue("Role")).toHaveTextContent("Staff")
    expect(within(getValue("Status")).getByText("Inactive")).toBeInTheDocument()
    expect(getValue("Last Login")).toHaveTextContent("Never")
  })
})
