import { render } from "@testing-library/react"
import { vi } from "vitest"

import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated"
import { useAuth } from "@/hooks/use-auth"
import { createAuthUser } from "@/test-utils/auth-fixtures"

const replace = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))
vi.mock("@/hooks/use-auth")

describe("RedirectIfAuthenticated", () => {
  beforeEach(() => {
    replace.mockReset()
  })

  it("sends a signed-in user to the dashboard", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser(),
    })

    render(<RedirectIfAuthenticated />)

    expect(replace).toHaveBeenCalledWith("/dashboard")
  })

  it.each(["loading", "unauthenticated"] as const)(
    "does nothing while %s",
    (status) => {
      vi.mocked(useAuth).mockReturnValue({ status, user: null })

      render(<RedirectIfAuthenticated />)

      expect(replace).not.toHaveBeenCalled()
    }
  )
})
