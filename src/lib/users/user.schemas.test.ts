import { createUserSchema } from "@/lib/users/user.schemas"

// First message per field, which is what the form displays.
function getErrors(result: ReturnType<typeof createUserSchema.safeParse>) {
  const errors: Record<string, string> = {}
  if (result.success) return errors

  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message
  }
  return errors
}

describe("createUserSchema", () => {
  it("accepts a valid user and trims the values", () => {
    const result = createUserSchema.safeParse({
      name: "  Ada Lovelace ",
      email: " ada@example.com  ",
    })

    expect(result.data).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
    })
  })

  it("requires a name and an email", () => {
    const errors = getErrors(createUserSchema.safeParse({ name: "", email: "" }))

    expect(errors).toEqual({
      name: "Enter a name.",
      email: "Enter an email address.",
    })
  })

  it("treats a whitespace-only name as empty", () => {
    const errors = getErrors(
      createUserSchema.safeParse({ name: "   ", email: "ada@example.com" })
    )

    expect(errors.name).toBe("Enter a name.")
  })

  it("enforces name length limits", () => {
    const tooShort = getErrors(
      createUserSchema.safeParse({ name: "A", email: "a@example.com" })
    )
    const tooLong = getErrors(
      createUserSchema.safeParse({ name: "A".repeat(81), email: "a@example.com" })
    )

    expect(tooShort.name).toBe("Name must be at least 2 characters.")
    expect(tooLong.name).toBe("Name must be 80 characters or fewer.")
  })

  it("rejects a malformed email with a single message", () => {
    const errors = getErrors(
      createUserSchema.safeParse({ name: "Ada", email: "not-an-email" })
    )

    expect(errors).toEqual({ email: "Enter a valid email address." })
  })
})
