import { createUserSchema, editUserSchema } from "@/lib/users/user.schemas"

type ParseResult =
  | ReturnType<typeof createUserSchema.safeParse>
  | ReturnType<typeof editUserSchema.safeParse>

// First message per field, which is what the form displays.
function getErrors(result: ParseResult) {
  const errors: Record<string, string> = {}
  if (result.success) return errors

  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message
  }
  return errors
}

describe("createUserSchema", () => {
  const valid = { name: "Ada Lovelace", email: "ada@example.com", role: "STAFF" }

  it("accepts a valid user and trims the values", () => {
    const result = createUserSchema.safeParse({
      name: "  Ada Lovelace ",
      email: " ada@example.com  ",
      role: "ADMIN",
    })

    expect(result.data).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "ADMIN",
    })
  })

  it("requires a name, an email and a role", () => {
    const errors = getErrors(createUserSchema.safeParse({ name: "", email: "" }))

    expect(errors).toEqual({
      name: "Enter a name.",
      email: "Enter an email address.",
      role: "Select a role.",
    })
  })

  it("only accepts the roles the API knows", () => {
    for (const role of ["OWNER", "admin", ""]) {
      expect(getErrors(createUserSchema.safeParse({ ...valid, role }))).toEqual({
        role: "Select a role.",
      })
    }
  })

  it("treats a whitespace-only name as empty", () => {
    const errors = getErrors(createUserSchema.safeParse({ ...valid, name: "   " }))

    expect(errors.name).toBe("Enter a name.")
  })

  it("enforces name length limits", () => {
    const tooShort = getErrors(createUserSchema.safeParse({ ...valid, name: "A" }))
    const tooLong = getErrors(
      createUserSchema.safeParse({ ...valid, name: "A".repeat(81) })
    )

    expect(tooShort.name).toBe("Name must be at least 2 characters.")
    expect(tooLong.name).toBe("Name must be 80 characters or fewer.")
  })

  it("rejects a malformed email with a single message", () => {
    const errors = getErrors(
      createUserSchema.safeParse({ ...valid, email: "not-an-email" })
    )

    expect(errors).toEqual({ email: "Enter a valid email address." })
  })

  it("has no password field: invited users choose their own", () => {
    const result = createUserSchema.safeParse({ ...valid, password: "secret" })

    expect(result.data).not.toHaveProperty("password")
  })
})

describe("editUserSchema", () => {
  const valid = { name: "Ada Lovelace", role: "STAFF", isActive: true }

  it("accepts a valid profile and trims the name", () => {
    const result = editUserSchema.safeParse({ ...valid, name: "  Ada  " })

    expect(result.data).toEqual({ name: "Ada", role: "STAFF", isActive: true })
  })

  it("validates the name and role like the create form", () => {
    const errors = getErrors(
      editUserSchema.safeParse({ name: "", role: "ROOT", isActive: false })
    )

    expect(errors).toEqual({ name: "Enter a name.", role: "Select a role." })
  })

  it("does not accept an email or password: the API manages those", () => {
    const result = editUserSchema.safeParse({
      ...valid,
      email: "other@example.com",
      newPassword: "long-enough-1",
    })

    expect(result.data).toEqual(valid)
  })
})
