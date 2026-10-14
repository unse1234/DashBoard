import { render, screen } from "@testing-library/react"

import { ProductImage } from "@/components/storefront/product-image"

const image = {
  url: "/images/storefront/products/kettle.png",
  alt: "Steel kettle",
}

function renderImage(props: Partial<Parameters<typeof ProductImage>[0]> = {}) {
  return render(
    <div className="relative">
      <ProductImage image={image} sizes="100px" {...props} />
    </div>
  )
}

describe("ProductImage", () => {
  it("names the picture with the API's alt text", () => {
    renderImage()

    expect(
      screen.getByRole("img", { name: "Steel kettle" })
    ).toBeInTheDocument()
  })

  it("is hidden from assistive technology when the text around it names the product", () => {
    renderImage({ decorative: true })

    expect(screen.queryByRole("img", { name: "Steel kettle" })).toBeNull()
    expect(screen.getByRole("presentation")).toBeInTheDocument()
  })

  it("loads lazily unless it is above the fold", () => {
    const { unmount } = renderImage()
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy")
    unmount()

    renderImage({ eager: true })
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager")
  })

  it("serves a picture from another site as it is, without going through the optimizer", () => {
    renderImage({
      image: { url: "https://cdn.example.com/kettle.jpg", alt: "Kettle" },
    })

    expect(screen.getByRole("img", { name: "Kettle" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/kettle.jpg"
    )
  })

  it("draws a hidden placeholder, and no picture, for a product without one", () => {
    const { container } = renderImage({ image: null })

    expect(screen.queryByRole("img")).toBeNull()
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull()
  })
})
