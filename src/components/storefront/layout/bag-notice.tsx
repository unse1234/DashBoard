"use client"

import { useBag } from "@/hooks/storefront/use-bag"

/**
 * Says why the last change to the bag was refused or failed (a product with no
 * more stock, a server that did not answer). The bag itself is untouched when
 * this shows, so the shopper still sees what they had.
 */
export function BagNotice() {
  const { notice, dismissNotice } = useBag()
  if (!notice) return null

  return (
    // Keyed, so the same refusal twice in a row is announced twice. Sticky, so
    // it is seen when the add button that caused it is far down a long page.
    <div
      key={notice.id}
      role="alert"
      className="sticky top-4 z-20 mb-4 flex items-start justify-between gap-4 rounded-store-md bg-white p-4 shadow-store-field"
    >
      <p className="text-base leading-6">{notice.message}</p>
      <button
        type="button"
        onClick={dismissNotice}
        className="shrink-0 rounded-store-sm px-3 py-1 text-base font-medium outline-none hover:bg-store-canvas focus-visible:ring-3 focus-visible:ring-store-ink/40"
      >
        Dismiss
      </button>
    </div>
  )
}
