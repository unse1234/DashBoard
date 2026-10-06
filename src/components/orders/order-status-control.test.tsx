import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { OrderDetailsHeader } from "@/components/orders/order-details-header"
import { OrderStatusControl } from "@/components/orders/order-status-control"
import { getMockOrderById } from "@/lib/orders/order.mock-data"

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }))

type User = ReturnType<typeof userEvent.setup>

function getStatusSelect() {
  return screen.getByRole("combobox", { name: "Change status" })
}

async function openStatusOptions(user: User) {
  await user.click(getStatusSelect())
  const listbox = await screen.findByRole("listbox")
  return within(listbox).getAllByRole("option")
}

async function choose(user: User, label: string) {
  await openStatusOptions(user)
  await user.click(screen.getByRole("option", { name: label }))
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("OrderStatusControl", () => {
  it("starts on the order's status with Update disabled", () => {
    render(<OrderStatusControl status="shipped" />)

    expect(getStatusSelect()).toHaveTextContent("Shipped")
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled()
  })

  it("offers every status, leaving the rules to the API", async () => {
    render(<OrderStatusControl status="delivered" />)
    const user = userEvent.setup()

    const options = await openStatusOptions(user)

    expect(options.map((option) => option.textContent)).toEqual([
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ])
  })

  it("enables Update only while a different status is chosen", async () => {
    render(<OrderStatusControl status="shipped" />)
    const user = userEvent.setup()
    const update = screen.getByRole("button", { name: "Update" })

    await choose(user, "Delivered")
    expect(update).toBeEnabled()

    await choose(user, "Shipped")
    expect(update).toBeDisabled()
  })

  it("sends the chosen status to onStatusChange", async () => {
    const onStatusChange = vi.fn()
    render(<OrderStatusControl status="shipped" onStatusChange={onStatusChange} />)
    const user = userEvent.setup()

    await choose(user, "Cancelled")
    await user.click(screen.getByRole("button", { name: "Update" }))

    expect(onStatusChange).toHaveBeenCalledWith("cancelled")
    expect(toast.info).not.toHaveBeenCalled()
  })

  it("says it is not available yet instead of pretending to update", async () => {
    render(<OrderStatusControl status="shipped" />)
    const user = userEvent.setup()

    await choose(user, "Delivered")
    await user.click(screen.getByRole("button", { name: "Update" }))

    expect(toast.info).toHaveBeenCalledWith(
      "Not available yet",
      expect.objectContaining({ description: expect.any(String) })
    )
  })
})

describe("OrderDetailsHeader", () => {
  it("keeps showing the order's status after Update, since nothing is saved", async () => {
    render(<OrderDetailsHeader order={getMockOrderById("ORD-31620")!} />)
    const user = userEvent.setup()

    await choose(user, "Delivered")
    await user.click(screen.getByRole("button", { name: "Update" }))

    const status = screen.getByText("Order Status", { selector: "dt" })
      .nextElementSibling as HTMLElement
    expect(within(status).getByText("Shipped")).toBeInTheDocument()
  })
})
