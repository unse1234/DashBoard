import { render, screen } from "@testing-library/react"

import { ProductRating } from "@/screens/storefront/product-details/components/product-rating"

describe("ProductRating", () => {
  it("reads the score as one sentence and shows it as text", () => {
    render(<ProductRating rating={4.5} />)

    expect(
      screen.getByRole("img", { name: "Rated 4.5 out of 5" })
    ).toBeInTheDocument()
    expect(screen.getByText("4.5 / 5")).toBeInTheDocument()
  })

  it("writes a whole score with one decimal", () => {
    render(<ProductRating rating={4} />)

    expect(
      screen.getByRole("img", { name: "Rated 4.0 out of 5" })
    ).toBeInTheDocument()
    expect(screen.getByText("4.0 / 5")).toBeInTheDocument()
  })

  it.each([
    { rating: 5, fills: ["full", "full", "full", "full", "full"] },
    { rating: 4.5, fills: ["full", "full", "full", "full", "half"] },
    { rating: 4, fills: ["full", "full", "full", "full", "empty"] },
    { rating: 3.5, fills: ["full", "full", "full", "half", "empty"] },
    { rating: 0, fills: ["empty", "empty", "empty", "empty", "empty"] },
  ])("draws a score of $rating as $fills", ({ rating, fills }) => {
    const { container } = render(<ProductRating rating={rating} />)

    const stars = [...container.querySelectorAll("[data-fill]")]
    expect(stars.map((star) => star.getAttribute("data-fill"))).toEqual(fills)
  })
})
