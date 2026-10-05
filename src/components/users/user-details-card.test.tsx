import { render, screen, within } from "@testing-library/react"

import { UserDetailsCard } from "@/components/users/user-details-card"
import { getMockUserByUid } from "@/lib/users/user.mock-data"

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

describe("UserDetailsCard", () => {
  it("shows every available detail with its label", () => {
    const user = getMockUserByUid("USR-10517")!
    render(<UserDetailsCard user={user} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Account details" })
    ).toBeInTheDocument()
    expect(getValue("UID")).toHaveTextContent("USR-10517")
    expect(getValue("Name")).toHaveTextContent("Alexandria Montgomery-Fitzgerald")
    expect(getValue("Email")).toHaveTextContent(user.email)
    expect(within(getValue("Status")).getByText("Active")).toBeInTheDocument()
    expect(getValue("Created At")).toHaveTextContent("Jan 27, 2025, 8:05 AM UTC")
    expect(getValue("Last Login")).toHaveTextContent("Sep 28, 2026, 11:48 AM UTC")
  })

  it("shows the inactive status and a missing login", () => {
    const user = getMockUserByUid("USR-10561")!
    render(<UserDetailsCard user={user} />)

    expect(within(getValue("Status")).getByText("Inactive")).toBeInTheDocument()
    expect(getValue("Last Login")).toHaveTextContent("Never")
  })
})
