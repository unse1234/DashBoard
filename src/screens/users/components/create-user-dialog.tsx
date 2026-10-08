"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

import { AuthFormMessage } from "@/components/auth/auth-form"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { describeApiError, isApiError } from "@/lib/api/api-error"
import { USER_ROLE_OPTIONS } from "@/lib/users/user.constants"
import {
  createUserSchema,
  type CreateUserValues,
} from "@/lib/users/user.schemas"
import { UserFormFooter } from "@/screens/users/components/user-form-footer"

type CreateUserDialogProps = {
  /** Called with the validated values; the dialog closes once it resolves, and shows the error if it rejects. */
  onSubmit?: (values: CreateUserValues) => void | Promise<void>
}

export function CreateUserDialog({ onSubmit }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden="true" />
        Create User
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            We&apos;ll email an invitation so they can choose their own
            password.
          </DialogDescription>
        </DialogHeader>
        <CreateUserForm onSubmit={onSubmit} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

type CreateUserFormProps = CreateUserDialogProps & {
  onSuccess: () => void
}

const HTTP_CONFLICT = 409

// Mounted only while the dialog is open, so every opening starts empty.
function CreateUserForm({ onSubmit, onSuccess }: CreateUserFormProps) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "STAFF" },
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: CreateUserValues) {
    try {
      await onSubmit?.(values)
      onSuccess()
    } catch (error) {
      const message = describeApiError(error)
      if (isApiError(error) && error.status === HTTP_CONFLICT) {
        // The only conflict creating a user can hit is a taken email address.
        form.setError("email", { message }, { shouldFocus: true })
      } else {
        form.setError("root", { message })
      }
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
        <AuthFormMessage status="error" message={errors.root?.message} />
        <FieldGroup>
          <FormField
            label="Name"
            autoComplete="off"
            required
            error={errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="off"
            required
            error={errors.email?.message}
            {...form.register("email")}
          />
          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <FormSelectField
                name={field.name}
                label="Role"
                options={USER_ROLE_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={fieldState.error?.message}
                description="Admins can manage users. Staff cannot."
                required
              />
            )}
          />
        </FieldGroup>
        <UserFormFooter
          isSubmitting={isSubmitting}
          submitLabel="Create user"
          submittingLabel="Creating…"
        />
      </fieldset>
    </form>
  )
}
