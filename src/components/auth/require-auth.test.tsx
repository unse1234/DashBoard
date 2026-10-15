import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { RequireAuth } from "@/components/auth/require-auth"
import { useAuth } from "@/hooks/auth/use-auth"
import { restoreSession } from "@/lib/auth/auth-store"
import { ApiError } from "@/lib/api/api-error"
import { createAuthUser } from "@/test-utils/auth-fixtures"

const replace = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))
vi.mock("@/hooks/auth/use-auth")
vi.mock("@/lib/auth/auth-store", () => ({ restoreSession: vi.fn() }))

function renderGuard() {
  return render(
    <RequireAuth>
      <p>Secret dashboard</p>
    </RequireAuth>
  )
}

describe("RequireAuth", () => {
  beforeEach(() => {
    replace.mockReset()
  })

  it("shows a loading state, and neither content nor a redirect, while the session is restored", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    renderGuard()

    expect(
      screen.getByRole("status", { name: "Loading your account" })
    ).toBeVisible()
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects visitors without a session to the login screen", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "unauthenticated",
      user: null,
    })

    renderGuard()

    expect(replace).toHaveBeenCalledWith("/login")
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument()
  })

  it("offers Retry without redirecting or exposing content after a restore failure", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "error",
      user: null,
      error: new ApiError(0, ["The server is taking too long to respond."]),
    })

    renderGuard()

    expect(screen.getByRole("alert")).toHaveTextContent(/taking too long/)
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(restoreSession).toHaveBeenCalledTimes(1)
  })

  it("sends users with an unverified email to verification instead", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser({ emailVerifiedAt: null }),
    })

    renderGuard()

    expect(replace).toHaveBeenCalledWith("/verify-email")
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument()
  })

  it("renders the dashboard for a verified, signed-in user", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser(),
    })

    renderGuard()

    expect(screen.getByText("Secret dashboard")).toBeVisible()
    expect(replace).not.toHaveBeenCalled()
  })
})
