import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { AdminOnly } from "@/components/auth/admin-only"
import { useAuth } from "@/hooks/use-auth"
import { createAuthUser } from "@/test-utils/auth-fixtures"

vi.mock("@/hooks/use-auth")

function renderGate() {
  render(
    <AdminOnly>
      <p>User management</p>
    </AdminOnly>
  )
}

describe("AdminOnly", () => {
  it("shows its content to administrators", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser({ role: "ADMIN" }),
    })

    renderGate()

    expect(screen.getByText("User management")).toBeVisible()
  })

  it("explains the restriction to staff instead of showing the content", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser({ role: "STAFF" }),
    })

    renderGate()

    expect(screen.queryByText("User management")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "You don't have access to this page" })
    ).toBeVisible()
  })

  it("never shows the content without a user", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    renderGate()

    expect(screen.queryByText("User management")).not.toBeInTheDocument()
  })
})
