import type { BagDraftLine } from "@/types/storefront/bag.types"

/** Versioned, so a later change of shape can ignore what an older build wrote. */
export const BAG_STORAGE_KEY = "ecom-dash.storefront.bag.v1"

// The API's own bounds. A stored draft that breaks them is not ours: the
// server would refuse it, so it is dropped instead of sent.
const MAX_LINES = 100
const MAX_QUANTITY = 1000
const PRODUCT_ID = /^PRD-\d{1,10}$/i

function toDraft(value: unknown): BagDraftLine[] {
  if (!Array.isArray(value) || value.length > MAX_LINES) return []

  const seen = new Set<string>()
  const draft: BagDraftLine[] = []
  for (const line of value) {
    if (typeof line !== "object" || line === null) return []
    const { productId, quantity } = line as Record<string, unknown>
    if (
      typeof productId !== "string" ||
      !PRODUCT_ID.test(productId) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return []
    }
    const id = productId.toUpperCase()
    // A repeated product is a broken bag; the server would refuse all of it.
    if (seen.has(id)) return []
    seen.add(id)
    draft.push({ productId: id, quantity })
  }
  return draft
}

/**
 * The bag a previous visit left, or an empty one when there is none, storage is
 * unavailable (private windows, blocked site data), or what is there is not a
 * well-formed bag. Only product ids and quantities are ever stored; the server
 * prices them again before anything is shown.
 */
export function loadBagDraft(): BagDraftLine[] {
  try {
    const raw = window.localStorage.getItem(BAG_STORAGE_KEY)
    return raw ? toDraft(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

/** Remembers the bag; an unavailable store is not an error worth showing. */
export function saveBagDraft(draft: BagDraftLine[]) {
  try {
    if (draft.length === 0) {
      window.localStorage.removeItem(BAG_STORAGE_KEY)
    } else {
      window.localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(draft))
    }
  } catch {
    // The bag still works for this visit.
  }
}
