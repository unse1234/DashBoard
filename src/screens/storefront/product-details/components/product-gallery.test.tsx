import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProductGallery } from "@/screens/storefront/product-details/components/product-gallery"
import type { StorefrontProductImage } from "@/types/storefront/product.types"

// Distinct pictures, so a change of the main image is observable.
const images: StorefrontProductImage[] = [
  { url: "/front.png", alt: "Front of the watch" },
  { url: "/side.png", alt: "Side of the watch" },
  { url: "/back.png", alt: "Back of the watch" },
]

const thumbnails = () =>
  screen.getAllByRole("button", { name: /^Show image \d of 3$/ })

// next/image rewrites src to /_next/image?url=<encoded src>.
const mainImageSource = () =>
  decodeURIComponent(screen.getByRole("img").getAttribute("src") ?? "")

describe("ProductGallery", () => {
  it("shows the first picture with its first thumbnail selected", () => {
    render(<ProductGallery images={images} />)

    expect(
      screen.getByRole("img", { name: "Front of the watch" })
    ).toBeInTheDocument()
    expect(thumbnails().map((button) => button.ariaPressed)).toEqual([
      "true",
      "false",
      "false",
    ])
  })

  it("names the thumbnails and keeps them out of the image list", () => {
    render(<ProductGallery images={images} />)

    expect(screen.getByRole("list", { name: "Product images" })).toBeVisible()
    expect(thumbnails().map((button) => button.ariaLabel)).toEqual([
      "Show image 1 of 3",
      "Show image 2 of 3",
      "Show image 3 of 3",
    ])
    // The thumbnail pictures are decorative: only the main image is an img.
    expect(screen.getAllByRole("img")).toHaveLength(1)
  })

  it("shows the chosen picture and marks its thumbnail as the selected one", async () => {
    render(<ProductGallery images={images} />)

    await userEvent.click(thumbnails()[2])

    expect(
      screen.getByRole("img", { name: "Back of the watch" })
    ).toBeInTheDocument()
    expect(mainImageSource()).toContain("/back.png")
    expect(thumbnails().map((button) => button.ariaPressed)).toEqual([
      "false",
      "false",
      "true",
    ])
  })

  it("can be operated from the keyboard", async () => {
    render(<ProductGallery images={images} />)

    await userEvent.tab()
    await userEvent.tab()
    expect(thumbnails()[1]).toHaveFocus()

    await userEvent.keyboard("{Enter}")
    expect(
      screen.getByRole("img", { name: "Side of the watch" })
    ).toBeInTheDocument()

    await userEvent.tab()
    await userEvent.keyboard(" ")
    expect(
      screen.getByRole("img", { name: "Back of the watch" })
    ).toBeInTheDocument()
  })

  it("offers no chooser for a single picture", () => {
    render(<ProductGallery images={[images[0]]} />)

    expect(
      screen.getByRole("img", { name: "Front of the watch" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("says there is no picture, and shows no image, for a product without any", () => {
    render(<ProductGallery images={[]} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("No image available")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
