"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AuthFormMessage } from "@/components/auth/auth-form"
import { DialogFormFooter } from "@/components/shared/dialog-form-footer"
import { FormField } from "@/components/shared/form-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { useAuth } from "@/hooks/use-auth"
import { describeApiError } from "@/lib/api/api-error"
import type { AuthUser } from "@/types/auth.types"
import { useUpdateProfileMutation } from "@/lib/users/user.mutations"
import { profileSchema } from "@/validations/user.schemas";
import { type ProfileValues } from "@/types/user.types";

type EditProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The signed-in user's own details. Only the name can be changed. */
export function EditProfileDialog({
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const { user } = useAuth()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update how your name appears in the dashboard.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <EditProfileForm user={user} onSuccess={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

type EditProfileFormProps = {
  user: AuthUser
  onSuccess: () => void
}

// Mounted only while the dialog is open, so every opening starts from the current name.
function EditProfileForm({ user, onSuccess }: EditProfileFormProps) {
  const { mutateAsync: updateProfile } = useUpdateProfileMutation()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: ProfileValues) {
    try {
      if (values.name !== user.name) {
        await updateProfile(values)
        toast.success("Your profile was updated.")
      }
      onSuccess()
    } catch (error) {
      form.setError("root", { message: describeApiError(error) })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
        <AuthFormMessage status="error" message={errors.root?.message} />
        <FieldGroup>
          <FormField
            label="Name"
            autoComplete="name"
            required
            error={errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            name="email"
            label="Email"
            type="email"
            autoComplete="off"
            readOnly
            defaultValue={user.email}
            description="Your email address can't be changed."
          />
        </FieldGroup>
        <DialogFormFooter
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          submittingLabel="Saving…"
        />
      </fieldset>
    </form>
  )
}
