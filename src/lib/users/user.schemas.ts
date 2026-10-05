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

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

export type CreateUserValues = z.infer<typeof createUserSchema>
