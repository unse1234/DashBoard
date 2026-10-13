import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/utils/cn"

type QuantityStepperProps = {
  /** Names the product for assistive technology, e.g. "Dell XPS 13, White". */
  label: string
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
}

const stepButtonClassName =
  "flex size-10 items-center justify-center rounded-store-sm outline-none transition-colors hover:bg-store-canvas focus-visible:ring-3 focus-visible:ring-store-ink/40"

/** Minus, quantity, plus. At one unit the minus removes the line, and says so. */
export function QuantityStepper({
  label,
  quantity,
  onDecrease,
  onIncrease,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`Quantity of ${label}`}
      className="flex items-center"
    >
      <button
        type="button"
        onClick={onDecrease}
        aria-label={
          quantity > 1
            ? `Decrease quantity of ${label}`
            : `Remove ${label} from bag`
        }
        className={cn(stepButtonClassName, "text-store-danger")}
      >
        {/* A 20px box draws the design's 12px glyph; the heavier stroke is 2px at that size. */}
        <MinusIcon className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span className="px-3 text-center text-xl leading-7">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Increase quantity of ${label}`}
        className={cn(stepButtonClassName, "text-store-accent")}
      >
        <PlusIcon className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  )
}
