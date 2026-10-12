import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { markOrderPaid, updateOrderStatus } from "@/lib/orders/order.api"
import type { Order } from "@/types/order.types"
import { OrderDetailsHeader } from "@/screens/orders/details/components/order-details-header"
import { OrderStatusControl } from "@/screens/orders/details/components/order-status-control"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createOrder } from "@/test-utils/order-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/lib/orders/order.api")
vi.mock("@/hooks/use-auth")
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

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

function renderControl(
  props: Partial<React.ComponentProps<typeof OrderStatusControl>> = {}
) {
  const onStatusChange =
    props.onStatusChange ?? vi.fn().mockResolvedValue(undefined)
  renderWithQuery(
    <OrderStatusControl
      orderId="ORD-10001"
      status="shipped"
      paymentStatus="paid"
      onStatusChange={onStatusChange}
      {...props}
    />
  )
  return { onStatusChange }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
})

describe("OrderStatusControl", () => {
  it("starts on the order's status with Update disabled", () => {
    renderControl()

    expect(getStatusSelect()).toHaveTextContent("Shipped")
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled()
  })

  it("offers every status, leaving the rules to the API", async () => {
    renderControl({ status: "delivered" })
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
    renderControl()
    const user = userEvent.setup()
    const update = screen.getByRole("button", { name: "Update" })

    await choose(user, "Delivered")
    expect(update).toBeEnabled()

    await choose(user, "Shipped")
    expect(update).toBeDisabled()
  })

  it("sends the chosen status to onStatusChange", async () => {
    const { onStatusChange } = renderControl()
    const user = userEvent.setup()

    await choose(user, "Delivered")
    await user.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() =>
      expect(onStatusChange).toHaveBeenCalledWith("delivered")
    )
    expect(onStatusChange).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("is disabled while the change is being made, so it cannot be sent twice", async () => {
    let finish: () => void = () => {}
    const onStatusChange = vi
      .fn()
      .mockReturnValue(new Promise<void>((resolve) => (finish = resolve)))
    renderControl({ onStatusChange })
    const user = userEvent.setup()

    await choose(user, "Delivered")
    await user.click(screen.getByRole("button", { name: "Update" }))

    const updating = await screen.findByRole("button", { name: "Updating…" })
    expect(updating).toBeDisabled()
    expect(getStatusSelect()).toBeDisabled()
    expect(onStatusChange).toHaveBeenCalledTimes(1)

    finish()
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument()
    )
  })

  it("says why the API refused, and lets the change be tried again", async () => {
    const onStatusChange = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, [
          "An order can only be marked as shipped once it has been paid.",
        ])
      )
    renderControl({
      status: "processing",
      paymentStatus: "pending",
      onStatusChange,
    })
    const user = userEvent.setup()

    await choose(user, "Shipped")
    await user.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "An order can only be marked as shipped once it has been paid."
      )
    )
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled()
    expect(getStatusSelect()).toHaveTextContent("Shipped")
  })

  describe("cancelling", () => {
    async function chooseCancelled(user: User) {
      await choose(user, "Cancelled")
      await user.click(screen.getByRole("button", { name: "Update" }))
      return screen.findByRole("dialog")
    }

    it("asks first, and does nothing if the dialog is dismissed", async () => {
      const { onStatusChange } = renderControl({
        status: "pending",
        paymentStatus: "pending",
      })
      const user = userEvent.setup()

      const dialog = await chooseCancelled(user)

      expect(dialog).toHaveTextContent("Cancel order ORD-10001?")
      expect(dialog).toHaveTextContent("Its items go back into stock.")
      expect(dialog).not.toHaveTextContent("refund")
      expect(onStatusChange).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
      expect(onStatusChange).not.toHaveBeenCalled()
    })

    it("says a paid order is recorded as refunded, and that the refund is not sent from here", async () => {
      renderControl({ status: "processing", paymentStatus: "paid" })
      const user = userEvent.setup()

      const dialog = await chooseCancelled(user)

      expect(dialog).toHaveTextContent("recorded as refunded")
      expect(dialog).toHaveTextContent("does not issue it")
    })

    it("cancels the order once confirmed", async () => {
      const { onStatusChange } = renderControl({
        status: "pending",
        paymentStatus: "pending",
      })
      const user = userEvent.setup()

      const dialog = await chooseCancelled(user)
      await user.click(
        within(dialog).getByRole("button", { name: "Yes, cancel order" })
      )

      await waitFor(() =>
        expect(onStatusChange).toHaveBeenCalledWith("cancelled")
      )
      expect(onStatusChange).toHaveBeenCalledTimes(1)
    })

    it("shows the reason in the dialog when the API refuses, and keeps it open", async () => {
      const onStatusChange = vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, ["A shipped order can't be cancelled."])
        )
      renderControl({ status: "shipped", onStatusChange })
      const user = userEvent.setup()

      const dialog = await chooseCancelled(user)
      await user.click(
        within(dialog).getByRole("button", { name: "Yes, cancel order" })
      )

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "A shipped order can't be cancelled."
      )
      expect(dialog).toBeInTheDocument()
    })
  })
})

describe("OrderDetailsHeader", () => {
  function renderHeader(order: Order) {
    renderWithQuery(<OrderDetailsHeader order={order} />)
    return userEvent.setup()
  }

  function getBadgeValue(label: string) {
    const term = screen.getByText(label, { selector: "dt" })
    return term.nextElementSibling as HTMLElement
  }

  it("shows the order's ID as the heading", () => {
    renderHeader(createOrder({ id: "ORD-31620" }))

    expect(
      screen.getByRole("heading", { level: 2, name: "Order ORD-31620" })
    ).toBeInTheDocument()
  })

  it("shows the statuses, creation date and total", () => {
    renderHeader(
      createOrder({
        status: "shipped",
        paymentStatus: "paid",
        total: 189.9,
        createdAt: "2026-09-29T08:40:00Z",
      })
    )

    expect(
      within(getBadgeValue("Order Status")).getByText("Shipped")
    ).toBeInTheDocument()
    expect(
      within(getBadgeValue("Payment Status")).getByText("Paid")
    ).toBeInTheDocument()
    expect(getBadgeValue("Created At")).toHaveTextContent(
      "Sep 29, 2026, 8:40 AM UTC"
    )
    expect(getBadgeValue("Total")).toHaveTextContent("$189.90")
  })

  it("asks the API to change the status, and announces what the order now is", async () => {
    const order = createOrder({ status: "shipped", paymentStatus: "paid" })
    vi.mocked(updateOrderStatus).mockResolvedValue({
      ...order,
      status: "delivered",
    })
    const user = renderHeader(order)

    await choose(user, "Delivered")
    await user.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() =>
      expect(updateOrderStatus).toHaveBeenCalledWith("ORD-10001", "delivered")
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Order ORD-10001 is now delivered."
      )
    )
  })

  it("keeps showing the order's status when the API refuses the change", async () => {
    const order = createOrder({ status: "delivered", paymentStatus: "paid" })
    vi.mocked(updateOrderStatus).mockRejectedValue(
      new ApiError(409, ["A delivered order can't change status."])
    )
    const user = renderHeader(order)

    await choose(user, "Shipped")
    await user.click(screen.getByRole("button", { name: "Update" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "A delivered order can't change status."
      )
    )
    expect(
      within(getBadgeValue("Order Status")).getByText("Delivered")
    ).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
  })

  describe("recording a payment", () => {
    it("is offered for an unpaid order that has not been cancelled", () => {
      renderHeader(createOrder({ status: "pending", paymentStatus: "pending" }))

      expect(
        screen.getByRole("button", { name: "Mark as paid" })
      ).toBeInTheDocument()
    })

    it.each([
      ["a paid order", "processing", "paid"],
      ["a cancelled order", "cancelled", "pending"],
      ["a refunded order", "cancelled", "refunded"],
    ] as const)("is not offered for %s", (_label, status, paymentStatus) => {
      renderHeader(createOrder({ status, paymentStatus }))

      expect(screen.queryByRole("button", { name: "Mark as paid" })).toBeNull()
    })

    it("asks first, then records the payment", async () => {
      const order = createOrder({
        status: "pending",
        paymentStatus: "pending",
        total: 61.75,
      })
      vi.mocked(markOrderPaid).mockResolvedValue({
        ...order,
        paymentStatus: "paid",
      })
      const user = renderHeader(order)

      await user.click(screen.getByRole("button", { name: "Mark as paid" }))
      const dialog = await screen.findByRole("dialog")
      expect(dialog).toHaveTextContent("Mark order ORD-10001 as paid?")
      expect(dialog).toHaveTextContent("$61.75")
      expect(markOrderPaid).not.toHaveBeenCalled()

      await user.click(
        within(dialog).getByRole("button", { name: "Mark as paid" })
      )

      await waitFor(() =>
        expect(markOrderPaid).toHaveBeenCalledWith("ORD-10001")
      )
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "Order ORD-10001 was marked as paid."
        )
      )
    })

    it("shows why the API refused, in the dialog", async () => {
      vi.mocked(markOrderPaid).mockRejectedValue(
        new ApiError(409, ["A cancelled order can't be marked as paid."])
      )
      const user = renderHeader(
        createOrder({ status: "pending", paymentStatus: "pending" })
      )

      await user.click(screen.getByRole("button", { name: "Mark as paid" }))
      const dialog = await screen.findByRole("dialog")
      await user.click(
        within(dialog).getByRole("button", { name: "Mark as paid" })
      )

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "A cancelled order can't be marked as paid."
      )
    })
  })
})
