import { z } from "zod"

import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation"

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 80
const EMAIL_MAX_LENGTH = 254
const PASSWORD_MAX_LENGTH = 128

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

export const editUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    isActive: z.boolean(),
    // Not trimmed: whitespace can be part of a password. Both empty means the
    // password stays as it is.
    newPassword: z
      .string()
      .max(
        PASSWORD_MAX_LENGTH,
        `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`
      ),
    confirmPassword: z.string(),
  })
  .superRefine(({ newPassword, confirmPassword }, context) => {
    if (!newPassword && !confirmPassword) return

    if (!newPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Enter a new password.",
      })
    } else if (newPassword.length < PASSWORD_MIN_LENGTH) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      })
    }

    if (!confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Confirm the new password.",
      })
    } else if (newPassword && confirmPassword !== newPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      })
    }
  })

export type EditUserValues = z.infer<typeof editUserSchema>
