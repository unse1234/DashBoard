"use client"

import { createContext, useMemo, useReducer, type ReactNode } from "react"

import type { BagItem } from "@/types/storefront/bag.types"
import type {
  StorefrontCurrency,
  StorefrontProduct,
} from "@/types/storefront/product.types"
import {
  addProductToBag,
  changeBagItemQuantity,
  getBagItemCount,
  getBagTotal,
} from "@/utils/storefront/bag.utils"
import { getProductLabel } from "@/utils/storefront/product-label"

// The shop sells in rupees; an empty bag is shown in them too.
const DEFAULT_CURRENCY: StorefrontCurrency = "PKR"

type BagState = {
  items: BagItem[]
  /** Spoken by the live region after the latest change; empty until there is one. */
  announcement: string
}

type BagAction =
  | { type: "add"; product: StorefrontProduct }
  | { type: "change"; productId: string; delta: number }

function bagReducer(state: BagState, action: BagAction): BagState {
  if (action.type === "add") {
    const items = addProductToBag(state.items, action.product)
    const quantity =
      items.find((item) => item.product.id === action.product.id)?.quantity ?? 1

    return {
      items,
      announcement: `${getProductLabel(action.product)}, added to bag. Quantity ${quantity}.`,
    }
  }

  const line = state.items.find((item) => item.product.id === action.productId)
  if (!line) return state

  const items = changeBagItemQuantity(
    state.items,
    action.productId,
    action.delta
  )
  const name = getProductLabel(line.product)
  const quantity = line.quantity + action.delta

  return {
    items,
    announcement:
      quantity > 0
        ? `${name}, quantity ${quantity}.`
        : `${name}, removed from bag.`,
  }
}

export type BagContextValue = {
  items: BagItem[]
  /** Units in the bag, not distinct products. */
  itemCount: number
  total: number
  /** What `total` is in: the currency of the bag's first line. */
  currency: StorefrontCurrency
  addProduct: (product: StorefrontProduct) => void
  /** Moves a line by `delta`; a line that reaches zero is removed. */
  changeQuantity: (productId: string, delta: number) => void
}

export const BagContext = createContext<BagContextValue | null>(null)

type BagProviderProps = {
  initialItems: BagItem[]
  children: ReactNode
}

/**
 * The storefront bag, kept in memory for as long as the storefront layout stays
 * mounted. It is independent of the staff session and is not persisted yet.
 */
export function BagProvider({ initialItems, children }: BagProviderProps) {
  const [state, dispatch] = useReducer(bagReducer, {
    items: initialItems,
    announcement: "",
  })

  const value = useMemo<BagContextValue>(
    () => ({
      items: state.items,
      itemCount: getBagItemCount(state.items),
      total: getBagTotal(state.items),
      currency: state.items[0]?.product.currency ?? DEFAULT_CURRENCY,
      addProduct: (product) => dispatch({ type: "add", product }),
      changeQuantity: (productId, delta) =>
        dispatch({ type: "change", productId, delta }),
    }),
    [state.items]
  )

  return (
    <BagContext.Provider value={value}>
      {children}
      {/* Announces changes without moving keyboard focus. */}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.announcement}
      </p>
    </BagContext.Provider>
  )
}
