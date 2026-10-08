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

describe("editUserSchema", () => {
  const validProfile = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    isActive: true,
  }

  function parse(newPassword: string, confirmPassword: string) {
    return editUserSchema.safeParse({
      ...validProfile,
      newPassword,
      confirmPassword,
    })
  }

  it("accepts the profile with both password fields empty", () => {
    expect(parse("", "").success).toBe(true)
  })

  it("accepts matching passwords of a valid length", () => {
    expect(parse("long-enough-1", "long-enough-1").success).toBe(true)
  })

  it("requires confirmation when only the new password is filled", () => {
    expect(getErrors(parse("long-enough-1", ""))).toEqual({
      confirmPassword: "Confirm the new password.",
    })
  })

  it("requires the new password when only the confirmation is filled", () => {
    expect(getErrors(parse("", "long-enough-1"))).toEqual({
      newPassword: "Enter a new password.",
    })
  })

  it("rejects passwords that do not match", () => {
    expect(getErrors(parse("long-enough-1", "long-enough-2"))).toEqual({
      confirmPassword: "Passwords do not match.",
    })
  })

  it("enforces the minimum password length", () => {
    expect(getErrors(parse("short", "short"))).toEqual({
      newPassword: "Password must be at least 12 characters.",
    })
  })

  it("does not trim passwords", () => {
    expect(parse("  padded-pass  ", "  padded-pass  ").data).toMatchObject({
      newPassword: "  padded-pass  ",
    })
  })

  it("validates the profile fields like the create form", () => {
    const errors = getErrors(
      editUserSchema.safeParse({
        name: "",
        email: "nope",
        isActive: false,
        newPassword: "",
        confirmPassword: "",
      })
    )

    expect(errors).toEqual({
      name: "Enter a name.",
      email: "Enter a valid email address.",
    })
  })

  it("still reports password errors when another field is invalid", () => {
    const errors = getErrors(
      editUserSchema.safeParse({
        name: "",
        email: "ada@example.com",
        isActive: true,
        newPassword: "long-enough-1",
        confirmPassword: "",
      })
    )

    expect(errors).toEqual({
      name: "Enter a name.",
      confirmPassword: "Confirm the new password.",
    })
  })
})
