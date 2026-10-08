import { z } from "zod"

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80
const EMAIL_MAX_LENGTH = 254

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters.`)
  .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or fewer.`)

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .max(
    EMAIL_MAX_LENGTH,
    `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`
  )
  .pipe(z.email("Enter a valid email address."))

const roleSchema = z.enum(["ADMIN", "STAFF"], { error: "Select a role." })

/** New users are invited by email and choose their own password. */
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
})

export type CreateUserValues = z.infer<typeof createUserSchema>

/** Email and password are not editable: the API leaves them to the user. */
export const editUserSchema = z.object({
  name: nameSchema,
  role: roleSchema,
  isActive: z.boolean(),
})

export type EditUserValues = z.infer<typeof editUserSchema>
