import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { CheckoutDraftProvider } from "@/providers/checkout-draft-provider"
import { ShippingAddressScreen } from "@/screens/storefront/shipping-address"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

function Draft() {
  const { draft } = useCheckoutDraft()
  return <output data-testid="draft">{JSON.stringify(draft)}</output>
}

function renderForm() {
  render(
    <CheckoutDraftProvider>
      <ShippingAddressScreen />
      <Draft />
    </CheckoutDraftProvider>
  )
  return userEvent.setup()
}

const draft = () => JSON.parse(screen.getByTestId("draft").textContent ?? "{}")

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Your Name"), "Ayesha Khan")
  await user.type(screen.getByLabelText("Email"), "ayesha@example.com")
  await user.type(screen.getByLabelText("Phone"), "0300 1234567")
  await user.type(
    screen.getByLabelText("Street Address"),
    "House 12, Street 4, F-7/2"
  )
  await user.type(screen.getByLabelText("City"), "Islamabad")
  await user.type(
    screen.getByLabelText("Province"),
    "Islamabad Capital Territory"
  )
}

beforeEach(() => push.mockClear())

describe("the delivery details form", () => {
  it("collects the contact and a Pakistan address, with the country fixed", () => {
    renderForm()

    for (const label of [
      "Your Name",
      "Email",
      "Phone",
      "Shipping Name",
      "Street Address",
      "Apartment, Floor or Landmark (optional)",
      "City",
      "Province",
      "Postal Code (optional)",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText("Country")).toHaveValue("Pakistan")
    expect(screen.getByLabelText("Country")).toHaveAttribute("readonly")
    // No card, default-address or save-for-later fields exist any more.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Phone")).toHaveAttribute("type", "tel")
  })

  it("aligns the field limits with the API: city and province 100, not 120", () => {
    renderForm()

    expect(screen.getByLabelText("City")).toHaveAttribute("maxlength", "100")
    expect(screen.getByLabelText("Province")).toHaveAttribute(
      "maxlength",
      "100"
    )
    expect(screen.getByLabelText("Your Name")).toHaveAttribute(
      "maxlength",
      "120"
    )
    expect(screen.getByLabelText("Street Address")).toHaveAttribute(
      "maxlength",
      "200"
    )
  })

  it("keeps what was typed, explains what is missing, and does not leave", async () => {
    const user = renderForm()
    await user.type(screen.getByLabelText("Your Name"), "Ayesha Khan")

    await user.click(screen.getByRole("button", { name: "Save and Continue" }))

    expect(
      await screen.findByText("Enter your email address.")
    ).toBeInTheDocument()
    expect(screen.getByText("Enter a street address.")).toBeInTheDocument()
    expect(screen.getByText("Enter a city.")).toBeInTheDocument()
    expect(screen.getByText("Enter a province.")).toBeInTheDocument()
    expect(screen.getByLabelText("Your Name")).toHaveValue("Ayesha Khan")
    expect(screen.getByLabelText("City")).toHaveAccessibleDescription(
      "Enter a city."
    )
    expect(push).not.toHaveBeenCalled()
    expect(draft()).toEqual({ contact: null, shippingAddress: null })
  })

  it("refuses a phone number that is not Pakistani-looking, and an invalid postal code", async () => {
    const user = renderForm()
    await fillRequired(user)
    await user.clear(screen.getByLabelText("Phone"))
    await user.type(screen.getByLabelText("Phone"), "12345")
    await user.type(screen.getByLabelText("Postal Code (optional)"), "54")

    await user.click(screen.getByRole("button", { name: "Save and Continue" }))

    expect(
      await screen.findByText(/Enter a Pakistani phone number/)
    ).toBeInTheDocument()
    expect(screen.getByText("Use five digits.")).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it("saves trimmed details to the draft and goes back to the review", async () => {
    const user = renderForm()
    await fillRequired(user)
    await user.type(screen.getByLabelText("Postal Code (optional)"), "44000")
    await user.type(
      screen.getByLabelText("Apartment, Floor or Landmark (optional)"),
      "  Near the park  "
    )

    await user.click(screen.getByRole("button", { name: "Save and Continue" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith(routes.checkout))
    expect(draft()).toEqual({
      contact: {
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "0300 1234567",
      },
      shippingAddress: {
        // Left blank, the order goes to the buyer.
        recipientName: "Ayesha Khan",
        addressLine1: "House 12, Street 4, F-7/2",
        addressLine2: "Near the park",
        city: "Islamabad",
        region: "Islamabad Capital Territory",
        postalCode: "44000",
      },
    })
  })

  it("delivers to another person when a shipping name is given", async () => {
    const user = renderForm()
    await fillRequired(user)
    await user.type(screen.getByLabelText("Shipping Name"), "Bilal Khan")

    await user.click(screen.getByRole("button", { name: "Save and Continue" }))

    await waitFor(() => expect(push).toHaveBeenCalled())
    expect(draft().shippingAddress.recipientName).toBe("Bilal Khan")
    expect(draft().contact.name).toBe("Ayesha Khan")
  })

  it("links Back to the review", () => {
    renderForm()

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      routes.checkout
    )
  })
})
