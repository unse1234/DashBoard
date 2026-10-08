import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { getUser } from "@/lib/users/user.api"
import { UserDetails } from "@/screens/users/details/components/user-details"
import { createUser } from "@/test-utils/user-fixtures"

vi.mock("@/lib/users/user.api")

const ada = createUser({ uid: "u-ada", name: "Ada Lovelace" })

describe("UserDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("shows a placeholder while loading, then the account details", async () => {
    let resolve: (value: typeof ada) => void = () => {}
    vi.mocked(getUser).mockReturnValue(new Promise((res) => (resolve = res)))
    const { container } = render(<UserDetails userId="u-ada" />)

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument()
    expect(screen.queryByText("Account details")).not.toBeInTheDocument()

    resolve(ada)
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument()
    expect(getUser).toHaveBeenCalledWith("u-ada", expect.any(AbortSignal))
  })

  it.each([404, 400])(
    "treats a %i as an unknown user",
    async (status) => {
      vi.mocked(getUser).mockRejectedValue(new ApiError(status, ["nope"]))

      render(<UserDetails userId="missing" />)

      expect(await screen.findByText("User not found")).toBeInTheDocument()
    }
  )

  it("reports other failures with a way to try again", async () => {
    vi.mocked(getUser)
      .mockRejectedValueOnce(new ApiError(500, ["internal detail"]))
      .mockResolvedValueOnce(ada)
    render(<UserDetails userId="u-ada" />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load this user")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument()
  })

  it("does not show another user's details while a different user loads", async () => {
    vi.mocked(getUser).mockResolvedValueOnce(ada)
    const { rerender } = render(<UserDetails userId="u-ada" />)
    await screen.findByText("Ada Lovelace")

    vi.mocked(getUser).mockReturnValueOnce(new Promise(() => {}))
    rerender(<UserDetails userId="u-other" />)

    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument()
  })
})
