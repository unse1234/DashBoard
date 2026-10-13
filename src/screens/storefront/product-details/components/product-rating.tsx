import { StarIcon } from "lucide-react"

import { cn } from "@/utils/cn"

const MAX_RATING = 5

type StarFill = "full" | "half" | "empty"

type ProductRatingProps = {
  /** Average review score from 0 to 5. */
  rating: number
  className?: string
}

function getStarFill(rating: number, index: number): StarFill {
  const remaining = rating - index
  if (remaining >= 1) return "full"
  if (remaining >= 0.5) return "half"
  return "empty"
}

function RatingStar({ fill }: { fill: StarFill }) {
  return (
    <span data-fill={fill} className="relative size-6">
      <StarIcon className="absolute inset-0 size-6" strokeWidth={1.75} />
      {fill !== "empty" && (
        <span
          className={cn(
            "absolute inset-y-0 left-0 overflow-hidden",
            fill === "half" ? "w-1/2" : "w-full"
          )}
        >
          <StarIcon className="size-6 fill-current" strokeWidth={1.75} />
        </span>
      )}
    </span>
  )
}

/**
 * Stars and the score, read out as one sentence. The green is the design's and
 * is not in the store palette yet.
 */
export function ProductRating({ rating, className }: ProductRatingProps) {
  return (
    <div
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of ${MAX_RATING}`}
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-1 text-[#12805d]",
        className
      )}
    >
      <div className="flex gap-2">
        {Array.from({ length: MAX_RATING }, (_, index) => (
          <RatingStar key={index} fill={getStarFill(rating, index)} />
        ))}
      </div>
      <span className="text-xl leading-6">
        {rating.toFixed(1)} / {MAX_RATING}
      </span>
    </div>
  )
}
