import { StrictMode } from "react"
import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { verifyEmail } from "@/lib/auth/auth.api"
import {
  getAuthState,
  refreshSession,
  restoreSession,
} from "@/lib/auth/auth-store"
import { TokenVerification } from "@/screens/auth/verify-email/components/token-verification"
import { createAuthUser } from "@/test-utils/auth-fixtures"

vi.mock("@/lib/auth/auth.api")
vi.mock("@/lib/auth/auth-store")
vi.mock("@/hooks/use-auth")

function signedOut() {
  const state = { status: "unauthenticated", user: null } as const
  vi.mocked(useAuth).mockReturnValue(state)
  vi.mocked(getAuthState).mockReturnValue(state)
}

function signedIn() {
  const state = {
    status: "authenticated",
    user: createAuthUser({ emailVerifiedAt: null }),
  } as const
  vi.mocked(useAuth).mockReturnValue(state)
  vi.mocked(getAuthState).mockReturnValue(state)
}

describe("TokenVerification", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(restoreSession).mockResolvedValue(undefined)
    vi.mocked(refreshSession).mockResolvedValue(true)
  })

  it("verifies once, even when effects run twice, and offers login to visitors", async () => {
    signedOut()
    vi.mocked(verifyEmail).mockResolvedValue({ message: "ok" })

    render(
      <StrictMode>
        <TokenVerification token="the-token" />
      </StrictMode>
    )

    expect(
      await screen.findByRole("heading", { name: "Email verified" })
    ).toBeVisible()
    expect(verifyEmail).toHaveBeenCalledTimes(1)
    expect(verifyEmail).toHaveBeenCalledWith("the-token")
    expect(
      screen.getByRole("link", { name: "Continue to log in" })
    ).toHaveAttribute("href", "/login")
    // Nothing to reload without a session.
    expect(refreshSession).not.toHaveBeenCalled()
  })

  it("reloads a signed-in user's session so the dashboard accepts them", async () => {
    signedIn()
    vi.mocked(verifyEmail).mockResolvedValue({ message: "ok" })

    render(<TokenVerification token="the-token" />)

    expect(
      await screen.findByRole("link", { name: "Continue to dashboard" })
    ).toHaveAttribute("href", "/dashboard")
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it("explains an invalid or expired link", async () => {
    signedOut()
    vi.mocked(verifyEmail).mockRejectedValue(
      new ApiError(400, ["Invalid or expired token"])
    )

    render(<TokenVerification token="old-token" />)

    expect(
      await screen.findByRole("heading", { name: "Verification failed" })
    ).toBeVisible()
    expect(screen.getByText(/invalid or has expired/i)).toBeVisible()
    expect(screen.getByRole("link", { name: "Back to log in" })).toBeVisible()
  })

  it("reports other failures in user-friendly terms", async () => {
    signedOut()
    vi.mocked(verifyEmail).mockRejectedValue(new ApiError(500, ["boom"]))

    render(<TokenVerification token="the-token" />)

    expect(
      await screen.findByText(/something went wrong on our side/i)
    ).toBeVisible()
    expect(screen.queryByText("boom")).not.toBeInTheDocument()
  })
})
