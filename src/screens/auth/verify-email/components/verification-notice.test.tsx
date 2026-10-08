import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { resendVerification } from "@/lib/auth/account.api"
import { signOut } from "@/lib/auth/auth-store"
import { VerificationNotice } from "@/screens/auth/verify-email/components/verification-notice"
import { createAuthUser } from "@/test-utils/auth-fixtures"

vi.mock("@/hooks/use-auth")
vi.mock("@/lib/auth/account.api")
vi.mock("@/lib/auth/auth-store")

const unverified = createAuthUser({ emailVerifiedAt: null })

describe("VerificationNotice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("waits for the session to load", () => {
    vi.mocked(useAuth).mockReturnValue({ status: "loading", user: null })

    render(<VerificationNotice />)

    expect(
      screen.getByRole("status", { name: "Loading your account" })
    ).toBeVisible()
  })

  it("sends visitors without a session to log in", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "unauthenticated",
      user: null,
    })

    render(<VerificationNotice />)

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login"
    )
  })

  it("lets an already verified user continue", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser(),
    })

    render(<VerificationNotice />)

    expect(
      screen.getByRole("link", { name: "Continue to dashboard" })
    ).toBeVisible()
  })

  it("names the address and resends the verification email", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: unverified,
    })
    vi.mocked(resendVerification).mockResolvedValue({
      message: "A new link has been sent.",
    })
    render(<VerificationNotice />)

    expect(screen.getByText(/ada@example\.com/)).toBeVisible()
    await userEvent.click(
      screen.getByRole("button", { name: "Resend verification email" })
    )

    expect(await screen.findByRole("status")).toHaveTextContent(
      "A new link has been sent."
    )
    expect(resendVerification).toHaveBeenCalledTimes(1)
  })

  it("explains rate limiting when resending too often", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: unverified,
    })
    vi.mocked(resendVerification).mockRejectedValue(
      new ApiError(429, ["ThrottlerException"])
    )
    render(<VerificationNotice />)

    await userEvent.click(
      screen.getByRole("button", { name: "Resend verification email" })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many attempts/i
    )
  })

  it("logs the user out", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: unverified,
    })
    vi.mocked(signOut).mockResolvedValue(undefined)
    render(<VerificationNotice />)

    await userEvent.click(screen.getByRole("button", { name: "Log out" }))

    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
