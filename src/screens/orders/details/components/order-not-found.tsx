export function OrderNotFound() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-medium">Order not found</h2>
      <p className="text-sm text-muted-foreground">
        There is no order with this ID. It may have been removed, or the link
        may be incorrect.
      </p>
    </div>
  )
}
