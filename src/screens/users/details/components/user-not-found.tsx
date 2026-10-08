export function UserNotFound() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-medium">User not found</h2>
      <p className="text-sm text-muted-foreground">
        There is no user with this UID. It may have been removed, or the link
        may be incorrect.
      </p>
    </div>
  )
}
