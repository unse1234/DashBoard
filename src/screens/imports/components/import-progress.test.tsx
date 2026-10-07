import { render, screen } from "@testing-library/react"

import { ImportProgress } from "@/screens/imports/components/import-progress"
import { ImportStatusBadge } from "@/screens/imports/components/import-status-badge"

describe("ImportProgress", () => {
  it("shows whatever value it is given, with its label", () => {
    render(<ImportProgress value={57} label="Uploading products.csv" />)

    const progress = screen.getByRole("progressbar", {
      name: "Uploading products.csv",
    })
    expect(progress).toHaveAttribute("aria-valuenow", "57")
    expect(progress).toHaveAttribute("aria-valuetext", "57%")
    expect(screen.getByText("57%")).toBeInTheDocument()
  })

  it("handles the ends of the range", () => {
    const { rerender } = render(<ImportProgress value={0} label="Starting" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")

    rerender(<ImportProgress value={100} label="Done" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })
})

describe("ImportStatusBadge", () => {
  it.each([
    ["processing", "Processing"],
    ["queued", "Queued"],
    ["completed", "Completed"],
    ["failed", "Failed"],
  ] as const)(
    "names the %s status in text, not just with an icon or colour",
    (status, label) => {
      render(<ImportStatusBadge status={status} />)

      expect(screen.getByText(label)).toBeInTheDocument()
    }
  )
})
