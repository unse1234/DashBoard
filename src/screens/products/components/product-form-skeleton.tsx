import { Skeleton } from "@/components/ui/skeleton"

/** The form's outline (its three sections) while what it needs loads. */
export function ProductFormSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 md:gap-6">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}
