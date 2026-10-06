import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { OrderDetailsHeader } from "@/components/orders/order-details-header"
import { getMockOrderById } from "@/lib/orders/order.mock-data"

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

function getOrder(orderId: string) {
  return getMockOrderById(orderId)!
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

function getStatusSelect() {
  return screen.getByRole("combobox", { name: "Change status" })
}

async function openStatusOptions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getStatusSelect())
  const listbox = await screen.findByRole("listbox")
  return within(listbox).getAllByRole("option")
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("OrderStatusControl", () => {
  it("offers the current status, the stages after it and cancelled", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)
    const user = userEvent.setup()

    const options = await openStatusOptions(user)

    expect(options.map((option) => option.textContent)).toEqual([
      "Shipped",
      "Delivered",
      "Cancelled",
    ])
  })

  it("offers every status for a pending order", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31640")} />)
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

  it("keeps Update disabled until a different status is chosen", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)
    const user = userEvent.setup()
    const update = screen.getByRole("button", { name: "Update" })

    expect(getStatusSelect()).toHaveTextContent("Shipped")
    expect(update).toBeDisabled()

    await openStatusOptions(user)
    await user.click(screen.getByRole("option", { name: "Delivered" }))

    expect(update).toBeEnabled()
    // Choosing alone changes nothing.
    expect(within(getValue("Order Status")).getByText("Shipped")).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()

    await openStatusOptions(user)
    await user.click(screen.getByRole("option", { name: "Shipped" }))

    expect(update).toBeDisabled()
  })

  it("updates the status shown and says so", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)
    const user = userEvent.setup()

    await openStatusOptions(user)
    await user.click(screen.getByRole("option", { name: "Delivered" }))
    await user.click(screen.getByRole("button", { name: "Update" }))

    expect(within(getValue("Order Status")).getByText("Delivered")).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Order ORD-31620 is now delivered.")
  })

  it("does not change the payment status", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31656")} />)
    const user = userEvent.setup()

    await openStatusOptions(user)
    await user.click(screen.getByRole("option", { name: "Cancelled" }))
    await user.click(screen.getByRole("button", { name: "Update" }))

    expect(within(getValue("Order Status")).getByText("Cancelled")).toBeInTheDocument()
    expect(within(getValue("Payment Status")).getByText("Paid")).toBeInTheDocument()
  })

  it("locks a status that is final once it is set", async () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)
    const user = userEvent.setup()

    await openStatusOptions(user)
    await user.click(screen.getByRole("option", { name: "Delivered" }))
    await user.click(screen.getByRole("button", { name: "Update" }))

    expect(getStatusSelect()).toBeDisabled()
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled()
    expect(screen.getByText("Delivered orders can't be changed.")).toBeInTheDocument()
  })

  it.each([
    ["ORD-31552", "Delivered"],
    ["ORD-31224", "Cancelled"],
  ])("cannot change %s, which is %s", (orderId, label) => {
    render(<OrderDetailsHeader order={getOrder(orderId)} />)

    expect(getStatusSelect()).toBeDisabled()
    expect(getStatusSelect()).toHaveTextContent(label)
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled()
    expect(getStatusSelect()).toHaveAccessibleDescription(
      `${label} orders can't be changed.`
    )
  })
})
