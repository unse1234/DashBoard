import { IMPORT_MAX_FILE_SIZE_BYTES } from "@/lib/imports/import.constants"
import { validateImportFile } from "@/lib/imports/import.validation"

describe("validateImportFile", () => {
  it("accepts a CSV within the size limit", () => {
    expect(validateImportFile({ name: "products.csv", size: 1024 })).toBeNull()
  })

  it("accepts a file of exactly the maximum size", () => {
    expect(
      validateImportFile({
        name: "products.csv",
        size: IMPORT_MAX_FILE_SIZE_BYTES,
      })
    ).toBeNull()
  })

  it("matches the extension regardless of case", () => {
    expect(validateImportFile({ name: "PRODUCTS.CSV", size: 1 })).toBeNull()
  })

  it("rejects other file types and names the file", () => {
    expect(validateImportFile({ name: "products.xlsx", size: 1024 })).toBe(
      "“products.xlsx” is not a CSV file. Choose a file that ends in .csv."
    )
  })

  it("does not accept a name that only contains csv", () => {
    expect(validateImportFile({ name: "csv", size: 1 })).not.toBeNull()
    expect(
      validateImportFile({ name: "products.csv.txt", size: 1 })
    ).not.toBeNull()
  })

  it("rejects a file over the limit and states the limit", () => {
    expect(
      validateImportFile({
        name: "big.csv",
        size: IMPORT_MAX_FILE_SIZE_BYTES + 1,
      })
    ).toBe("“big.csv” is too large. The maximum file size is 10 MB.")
  })

  it("reports the file type before the size", () => {
    expect(
      validateImportFile({
        name: "big.zip",
        size: IMPORT_MAX_FILE_SIZE_BYTES + 1,
      })
    ).toContain("is not a CSV file")
  })
})
