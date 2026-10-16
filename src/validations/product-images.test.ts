import {
  PRODUCT_IMAGE_MAX_BYTES,
  validateProductImageFiles,
} from "@/validations/product-images"

const file = (type = "image/png", size = 10) =>
  new File([new Uint8Array(size)], "image.png", { type })
it.each(["image/png", "image/jpeg", "image/webp"])(
  "accepts %s through the exact size boundary",
  (type) => {
    expect(
      validateProductImageFiles([file(type, PRODUCT_IMAGE_MAX_BYTES)], 7)
    ).toBeNull()
  }
)
it.each(["image/svg+xml", "image/gif", "text/plain", ""])(
  "rejects unsupported browser type %s",
  (type) => {
    expect(validateProductImageFiles([file(type)], 0)).toMatch(
      /JPEG, PNG, or WebP/
    )
  }
)
it("rejects empty/oversized files and empty batches", () => {
  expect(validateProductImageFiles([file("image/png", 0)], 0)).toMatch(/empty/)
  expect(
    validateProductImageFiles(
      [file("image/png", PRODUCT_IMAGE_MAX_BYTES + 1)],
      0
    )
  ).toMatch(/5 MiB/)
  expect(validateProductImageFiles([], 0)).toMatch(/at least one/)
})
it("counts existing external images plus all pending additions", () => {
  expect(validateProductImageFiles([file(), file()], 5, 1)).toBeNull()
  expect(validateProductImageFiles([file(), file()], 6, 1)).toMatch(/at most 8/)
  expect(
    validateProductImageFiles(
      Array.from({ length: 9 }, () => file()),
      0
    )
  ).toMatch(/at most 8/)
})
it("allows a one-file replacement when already full, but rejects multiple replacement files", () => {
  expect(validateProductImageFiles([file()], 8, 0, true)).toBeNull()
  expect(validateProductImageFiles([file(), file()], 8, 0, true)).toMatch(
    /exactly one/
  )
})
