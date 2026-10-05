"use client"

import { useId, type ComponentProps, type ReactNode } from "react"

import { PasswordInput } from "@/components/auth/password-input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthFieldProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  name: string
  label: string
  description?: ReactNode
  error?: string
}

/** Labelled input with its description and error wired up for assistive tech. */
export function AuthField({
  label,
  description,
  error,
  type = "text",
  ...inputProps
}: AuthFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy =
    [description && descriptionId, error && errorId]
      .filter(Boolean)
      .join(" ") || undefined

  const controlProps = {
    id,
    className: "h-9",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    ...inputProps,
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {type === "password" ? (
        <PasswordInput {...controlProps} />
      ) : (
        <Input type={type} {...controlProps} />
      )}
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  )
}
