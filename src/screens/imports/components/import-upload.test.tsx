import {
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IMPORT_MAX_FILE_SIZE_BYTES } from "@/constants/import.constants"
import { ImportUpload } from "@/screens/imports/components/import-upload"

const onValidate = vi.fn()
const onTemplate = vi.fn()

// The browser's file dialog filters by `accept`, but users can still pick any
// file, so the tests must be able to hand the input a non-CSV.
const user = userEvent.setup({ applyAccept: false })

function createFile(name: string, size = 2048) {
  const file = new File(["sku,name"], name, { type: "text/csv" })
  Object.defineProperty(file, "size", { value: size })
  return file
}

function getFileInput() {
  return screen.getByLabelText("Product CSV file")
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ImportUpload", () => {
  it("explains what can be selected", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Import products" })
    ).toBeInTheDocument()
    expect(screen.getByText(/up to 10 MB are accepted/)).toBeInTheDocument()
    expect(
      screen.getByText("Drag and drop a CSV file here")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Choose File" })
    ).toBeInTheDocument()
    expect(getFileInput()).toHaveAttribute("type", "file")
    expect(getFileInput()).toHaveAttribute(
      "accept",
      expect.stringContaining(".csv")
    )
  })

  it("opens the file picker from the Choose File button", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const click = vi.spyOn(getFileInput(), "click")

    await user.click(screen.getByRole("button", { name: "Choose File" }))

    expect(click).toHaveBeenCalledTimes(1)
  })

  it("shows the name and size of a valid CSV", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(getFileInput(), createFile("products_batch.csv", 49_459))

    expect(screen.getByText("products_batch.csv")).toBeInTheDocument()
    expect(screen.getByText("48.3 KB")).toBeInTheDocument()
    expect(screen.queryByText("Drag and drop a CSV file here")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Replace File" })
    ).toBeInTheDocument()
  })

  it("accepts a file of exactly the maximum size", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(
      getFileInput(),
      createFile("max.csv", IMPORT_MAX_FILE_SIZE_BYTES)
    )

    expect(screen.getByText("max.csv")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("rejects a file that is not a CSV and says why", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(getFileInput(), createFile("products.xlsx"))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "“products.xlsx” is not a CSV file. Choose a file that ends in .csv."
    )
    expect(
      screen.getByText("Drag and drop a CSV file here")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Choose File" })
    ).toHaveAccessibleDescription(/is not a CSV file/)
  })

  it("rejects a CSV over 10 MB and says why", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(
      getFileInput(),
      createFile("big.csv", IMPORT_MAX_FILE_SIZE_BYTES + 1)
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "“big.csv” is too large. The maximum file size is 10 MB."
    )
    expect(screen.queryByText("big.csv")).toBeNull()
  })

  it("replaces the selected file and clears an earlier error", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(getFileInput(), createFile("notes.txt"))
    expect(screen.getByRole("alert")).toBeInTheDocument()

    await user.upload(getFileInput(), createFile("first.csv"))
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByText("first.csv")).toBeInTheDocument()

    await user.upload(getFileInput(), createFile("second.csv"))
    expect(screen.queryByText("first.csv")).toBeNull()
    expect(screen.getByText("second.csv")).toBeInTheDocument()
  })

  it("drops the selection when a replacement is invalid", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.upload(getFileInput(), createFile("first.csv"))
    await user.upload(getFileInput(), createFile("second.pdf"))

    expect(screen.queryByText("first.csv")).toBeNull()
    expect(screen.getByRole("alert")).toHaveTextContent("second.pdf")
  })

  it("removes the selected file and returns focus to Choose File", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    await user.upload(getFileInput(), createFile("products.csv"))

    await user.click(
      screen.getByRole("button", { name: "Remove products.csv" })
    )

    expect(
      screen.getByText("Drag and drop a CSV file here")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose File" })).toHaveFocus()
  })

  it("can pick the same file again after removing it", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const file = createFile("products.csv")

    await user.upload(getFileInput(), file)
    await user.click(
      screen.getByRole("button", { name: "Remove products.csv" })
    )
    await user.upload(getFileInput(), file)

    expect(screen.getByText("products.csv")).toBeInTheDocument()
  })

  it("downloads the template when asked", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.click(
      screen.getByRole("button", { name: "Download CSV Template" })
    )

    expect(onTemplate).toHaveBeenCalledOnce()
  })

  it("opens the guidelines in a dialog", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    await user.click(screen.getByRole("button", { name: "Import Guidelines" }))

    const dialog = await screen.findByRole("dialog", {
      name: "Import guidelines",
    })
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(5)
    expect(
      within(dialog).getByText(/Keep the file under 10 MB/)
    ).toBeInTheDocument()
  })

  it("keeps validation disabled until a valid file is selected", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const importButton = screen.getByRole("button", { name: "Validate CSV" })

    expect(importButton).toBeDisabled()

    await user.upload(getFileInput(), createFile("notes.txt"))
    expect(screen.getByRole("button", { name: "Validate CSV" })).toBeDisabled()

    await user.upload(getFileInput(), createFile("products.csv"))
    expect(
      screen.getByRole("button", { name: "Validate products.csv" })
    ).toBeEnabled()

    await user.click(
      screen.getByRole("button", { name: "Remove products.csv" })
    )
    expect(screen.getByRole("button", { name: "Validate CSV" })).toBeDisabled()
  })

  it("sends the selected CSV to validation when asked", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    await user.upload(getFileInput(), createFile("products.csv"))

    await user.click(
      screen.getByRole("button", { name: "Validate products.csv" })
    )

    expect(onValidate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "products.csv" })
    )
    expect(screen.getByText("products.csv")).toBeInTheDocument()
  })
})

describe("ImportUpload while validating", () => {
  const onCancel = vi.fn()

  function renderValidating(uploadProgress: number | null) {
    render(
      <ImportUpload
        onValidate={onValidate}
        onTemplate={onTemplate}
        onCancel={onCancel}
        validating
        uploadProgress={uploadProgress}
      />
    )
  }

  it("shows no progress when nothing is being validated", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull()
  })

  it("reports the bytes sent as a real percentage", () => {
    renderValidating(40)

    const bar = screen.getByRole("progressbar", { name: "Uploading file" })
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(screen.getByRole("button", { name: "Validating…" })).toBeDisabled()
  })

  it("does not invent a percentage for the server's checks", () => {
    renderValidating(100)

    const bar = screen.getByRole("progressbar", { name: "Checking every row" })
    expect(bar).not.toHaveAttribute("aria-valuenow")
  })

  it("is indeterminate, and still an upload, before the first report", () => {
    renderValidating(null)

    const bar = screen.getByRole("progressbar", { name: "Uploading file" })
    expect(bar).not.toHaveAttribute("aria-valuenow")
  })

  it("lets the user cancel", async () => {
    renderValidating(10)

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("tells its owner when a multi-file drop clears the selection", async () => {
    const onSelectionChanged = vi.fn()
    render(
      <ImportUpload
        onValidate={onValidate}
        onTemplate={onTemplate}
        onSelectionChanged={onSelectionChanged}
      />
    )
    await user.upload(getFileInput(), createFile("first.csv"))
    onSelectionChanged.mockClear()

    fireEvent.drop(
      screen.getByRole("group", { name: "Product CSV drop area" }),
      {
        dataTransfer: {
          files: [createFile("a.csv"), createFile("b.csv")],
          types: ["Files"],
        },
      }
    )

    expect(onSelectionChanged).toHaveBeenCalledOnce()
    expect(screen.queryByText("first.csv")).toBeNull()
  })
})

describe("ImportUpload drag and drop", () => {
  function getDropArea() {
    return screen.getByRole("group", { name: "Product CSV drop area" })
  }

  function dropFiles(...files: File[]) {
    fireEvent.drop(getDropArea(), {
      dataTransfer: { files, types: ["Files"] },
    })
  }

  it("selects a dropped CSV like a chosen one", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    dropFiles(createFile("dropped.csv", 49_459))

    expect(screen.getByText("dropped.csv")).toBeInTheDocument()
    expect(screen.getByText("48.3 KB")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Validate dropped.csv" })
    ).toBeEnabled()
  })

  it("validates a dropped file the same way", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    dropFiles(createFile("report.pdf"))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "“report.pdf” is not a CSV file."
    )

    dropFiles(createFile("big.csv", IMPORT_MAX_FILE_SIZE_BYTES + 1))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "“big.csv” is too large."
    )
    expect(screen.queryByText("big.csv")).toBeNull()
  })

  it("replaces the current file with a dropped one", async () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    await user.upload(getFileInput(), createFile("first.csv"))

    dropFiles(createFile("second.csv"))

    expect(screen.queryByText("first.csv")).toBeNull()
    expect(screen.getByText("second.csv")).toBeInTheDocument()
  })

  it("asks for one file at a time instead of silently picking one", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    dropFiles(createFile("a.csv"), createFile("b.csv"))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Drop one file at a time."
    )
    expect(screen.queryByText("a.csv")).toBeNull()
  })

  it("highlights the area only while files are dragged over it", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const area = getDropArea()

    fireEvent.dragEnter(area, { dataTransfer: { types: ["Files"] } })
    expect(area).toHaveAttribute("data-dragging")
    expect(screen.getByText("Drop the file to select it")).toBeInTheDocument()

    fireEvent.dragLeave(area, { dataTransfer: { types: ["Files"] } })
    expect(area).not.toHaveAttribute("data-dragging")
    expect(
      screen.getByText("Drag and drop a CSV file here")
    ).toBeInTheDocument()
  })

  it("stays highlighted when the drag moves over a child of the area", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const area = getDropArea()
    const child = screen.getByRole("button", { name: "Choose File" })

    fireEvent.dragEnter(area, { dataTransfer: { types: ["Files"] } })
    // jsdom has no DragEvent, so testing-library ignores a relatedTarget option.
    const leave = createEvent.dragLeave(area, {
      dataTransfer: { types: ["Files"] },
    })
    Object.defineProperty(leave, "relatedTarget", { value: child })
    fireEvent(area, leave)

    expect(area).toHaveAttribute("data-dragging")
  })

  it("clears the highlight after a drop", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)

    fireEvent.dragEnter(getDropArea(), { dataTransfer: { types: ["Files"] } })
    dropFiles(createFile("dropped.csv"))

    expect(getDropArea()).not.toHaveAttribute("data-dragging")
  })

  it("ignores drags that are not files, such as selected text", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const area = getDropArea()

    fireEvent.dragEnter(area, { dataTransfer: { types: ["text/plain"] } })

    expect(area).not.toHaveAttribute("data-dragging")
  })

  it("allows a drop only when files are being dragged", () => {
    render(<ImportUpload onValidate={onValidate} onTemplate={onTemplate} />)
    const area = getDropArea()

    const filesDrag = createEvent.dragOver(area, {
      dataTransfer: { types: ["Files"] },
    })
    fireEvent(area, filesDrag)
    const textDrag = createEvent.dragOver(area, {
      dataTransfer: { types: ["text/plain"] },
    })
    fireEvent(area, textDrag)

    expect(filesDrag.defaultPrevented).toBe(true)
    expect(textDrag.defaultPrevented).toBe(false)
  })
})
