"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
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
import { UserFormFooter } from "@/components/users/user-form-footer"
import {
  createUserSchema,
  type CreateUserValues,
} from "@/lib/users/user.schemas"

type CreateUserDialogProps = {
  /** Called with the validated values; the dialog closes once it resolves. */
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
          <DialogDescription>Add a new user to the dashboard.</DialogDescription>
        </DialogHeader>
        <CreateUserForm onSubmit={onSubmit} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

type CreateUserFormProps = CreateUserDialogProps & {
  onSuccess: () => void
}

// Mounted only while the dialog is open, so every opening starts empty.
function CreateUserForm({ onSubmit, onSuccess }: CreateUserFormProps) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: CreateUserValues) {
    await onSubmit?.(values)
    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
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
