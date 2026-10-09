export function CustomerNotFound() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-medium">Customer not found</h2>
      <p className="text-sm text-muted-foreground">
        There is no customer with this ID. It may have been removed, or the link
        may be incorrect.
      </p>
    </div>
  )
}
