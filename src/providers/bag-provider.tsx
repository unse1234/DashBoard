"use client"

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"

import { describeApiError, isApiError } from "@/lib/api/api-error"
import { quoteBag } from "@/services/storefront/bag.api"
import type {
  BagAction,
  BagDraftLine,
  BagLine,
  BagQuote,
} from "@/types/storefront/bag.types"
import type {
  StorefrontCurrency,
  StorefrontProduct,
} from "@/types/storefront/product.types"
import { loadBagDraft, saveBagDraft } from "@/utils/storefront/bag-storage"
import { getProductLabel } from "@/utils/storefront/product-label"

// The shop sells in rupees; an empty bag is shown in them too.
const DEFAULT_CURRENCY: StorefrontCurrency = "PKR"

type BagState = {
  /** The server's last answer; null until there is one. */
  quote: BagQuote | null
  /** Requests sent and not yet answered. */
  pending: number
  /** A bag that came from the last visit is waiting for its first answer. */
  restoring: boolean
  /** Why the last change could not be made, for the shopper. */
  notice: { id: number; message: string } | null
  /** Why the bag could not be loaded or refreshed, if it could not. */
  loadError: unknown
  /** Spoken by the live region after the latest change; empty until there is one. */
  announcement: string
}

type BagEvent =
  | { type: "restoring" }
  | { type: "sending" }
  | { type: "quoted"; quote: BagQuote; announcement: string }
  | { type: "failed"; error: unknown; message: string; isRefresh: boolean }
  | { type: "dismissed" }
  | { type: "cleared" }

const initialState: BagState = {
  quote: null,
  pending: 0,
  restoring: false,
  notice: null,
  loadError: null,
  announcement: "",
}

let noticeSequence = 0

function bagReducer(state: BagState, event: BagEvent): BagState {
  switch (event.type) {
    case "restoring":
      return { ...state, restoring: true }
    case "sending":
      return { ...state, pending: state.pending + 1 }
    case "quoted":
      return {
        ...state,
        quote: event.quote,
        pending: Math.max(0, state.pending - 1),
        restoring: false,
        notice: null,
        loadError: null,
        announcement: event.announcement,
      }
    case "failed":
      return {
        ...state,
        pending: Math.max(0, state.pending - 1),
        restoring: false,
        // Shown (and read out) by the visible notice, so the status region
        // keeps what it last said instead of saying this twice.
        notice: { id: ++noticeSequence, message: event.message },
        loadError: event.isRefresh ? event.error : state.loadError,
      }
    case "dismissed":
      return { ...state, notice: null }
    case "cleared":
      return { ...initialState }
  }
}

function toDraft(quote: BagQuote): BagDraftLine[] {
  // Only the id and the quantity go back to the server: it refuses anything
  // else, and the prices on the lines are its to compute again.
  return quote.items.map(({ productId, quantity }) => ({
    productId,
    quantity,
  }))
}

/** What a screen reader hears after the server's answer to `action`. */
function announce(
  action: BagAction | undefined,
  quote: BagQuote,
  label: string
) {
  if (!action) return ""
  const line = quote.items.find((item) => item.productId === action.productId)
  if (!line) return `${label}, removed from bag.`
  return action.type === "add"
    ? `${label}, added to bag. Quantity ${line.quantity}.`
    : `${label}, quantity ${line.quantity}.`
}

/** The shopper-facing reason a change was not made. */
function describeFailure(error: unknown, label: string | null) {
  // A refused action names the product it is about.
  const refused =
    isApiError(error) &&
    error.status === 409 &&
    (error.code === "INSUFFICIENT_STOCK" ||
      error.code === "PRODUCT_UNAVAILABLE")
  if (refused && label) return `${label}: ${error.message}`
  return describeApiError(error)
}

export type BagContextValue = {
  /** The bag's lines as the server priced them, in the order it keeps them. */
  items: BagLine[]
  /** Units across all lines, as the server counts them. */
  itemCount: number
  /** Distinct products. */
  lineCount: number
  /** What the lines are worth, as the server computed it. */
  subtotal: number
  currency: StorefrontCurrency
  /** True when a line cannot be bought as it stands; checkout waits for that. */
  hasIssues: boolean
  /** A bag from the last visit is waiting for the server's first answer. */
  isRestoring: boolean
  /** A change is on its way to the server. */
  isUpdating: boolean
  /** Why the bag could not be loaded or refreshed, if it could not. */
  loadError: unknown
  /** Why the last change was refused or failed, or null. */
  notice: { id: number; message: string } | null
  dismissNotice: () => void
  /** The shopper's intents: the server applies them and answers with the bag. */
  addProduct: (product: StorefrontProduct) => void
  increase: (productId: string) => void
  decrease: (productId: string) => void
  remove: (productId: string) => void
  /** Asks the server again about the bag as it is, e.g. to retry a load. */
  refresh: () => void
  /** Empties the bag without asking the server, e.g. after an order was placed. */
  clear: () => void
}

export const BagContext = createContext<BagContextValue | null>(null)

type BagProviderProps = {
  children: ReactNode
  /**
   * Start with this bag instead of the one the last visit left. It is priced by
   * the server like any other.
   */
  initialDraft?: BagDraftLine[]
  /** Remember the bag between visits (default). Tests turn it off. */
  persist?: boolean
}

/**
 * The storefront bag. The client keeps only which products and how many, exactly
 * as the server last returned them (the draft); every price, total and count is
 * the server's answer to `POST /storefront/bag/quote`.
 *
 * What the shopper does is sent as an action and applied by the server, one
 * request at a time and in the order they were made, so a slow answer can never
 * land after a newer one and the draft each request starts from is always the
 * one the previous request produced. The bag lives for as long as the
 * storefront layout stays mounted, and the draft is remembered in this browser
 * so a reload does not lose it; it is independent of the staff session.
 */
export function BagProvider({
  children,
  initialDraft,
  persist = true,
}: BagProviderProps) {
  const [state, dispatch] = useReducer(bagReducer, initialState)

  const draftRef = useRef<BagDraftLine[]>([])
  // Mirrors the quote so a queued intent can name its product at the time it runs.
  const quoteRef = useRef<BagQuote | null>(null)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  // Bumped by `clear`: answers to requests of the bag that was emptied are dropped.
  const generationRef = useRef(0)
  const startedRef = useRef(false)

  const send = useCallback(
    (action?: BagAction, product?: StorefrontProduct) => {
      const generation = generationRef.current
      dispatch({ type: "sending" })

      queueRef.current = queueRef.current.then(async () => {
        if (generation !== generationRef.current) return

        const known = action
          ? quoteRef.current?.items.find(
              (item) => item.productId === action.productId
            )?.product
          : null
        const label = product
          ? getProductLabel(product)
          : known
            ? getProductLabel(known)
            : (action?.productId ?? "")

        try {
          const quote = await quoteBag({
            items: draftRef.current,
            action,
          })
          if (generation !== generationRef.current) return

          quoteRef.current = quote
          draftRef.current = toDraft(quote)
          if (persist) saveBagDraft(draftRef.current)
          dispatch({
            type: "quoted",
            quote,
            announcement: announce(action, quote, label),
          })
        } catch (error) {
          if (generation !== generationRef.current) return
          dispatch({
            type: "failed",
            error,
            message: describeFailure(error, action ? label : null),
            isRefresh: !action,
          })
        }
      })
    },
    [persist]
  )

  // Picks the bag up where the last visit left it. It is read after mount, not
  // while rendering, so the server-rendered page and the first client render
  // agree.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const start = initialDraft ?? (persist ? loadBagDraft() : [])
    if (start.length === 0) return

    draftRef.current = start
    dispatch({ type: "restoring" })
    send()
  }, [initialDraft, persist, send])

  const addProduct = useCallback(
    (product: StorefrontProduct) =>
      send({ type: "add", productId: product.id }, product),
    [send]
  )
  const increase = useCallback(
    (productId: string) => send({ type: "increment", productId }),
    [send]
  )
  const decrease = useCallback(
    (productId: string) => send({ type: "decrement", productId }),
    [send]
  )
  const remove = useCallback(
    (productId: string) => send({ type: "remove", productId }),
    [send]
  )
  // Nothing to ask about an empty bag.
  const refresh = useCallback(() => {
    if (draftRef.current.length > 0) send()
  }, [send])
  const clear = useCallback(() => {
    generationRef.current += 1
    draftRef.current = []
    quoteRef.current = null
    if (persist) saveBagDraft([])
    dispatch({ type: "cleared" })
  }, [persist])
  const dismissNotice = useCallback(() => dispatch({ type: "dismissed" }), [])

  const { quote } = state
  const value = useMemo<BagContextValue>(
    () => ({
      items: quote?.items ?? [],
      itemCount: quote?.unitCount ?? 0,
      lineCount: quote?.lineCount ?? 0,
      subtotal: quote?.subtotal ?? 0,
      currency: quote?.currency ?? DEFAULT_CURRENCY,
      hasIssues: quote?.hasIssues ?? false,
      isRestoring: state.restoring,
      isUpdating: state.pending > 0,
      loadError: state.loadError,
      notice: state.notice,
      dismissNotice,
      addProduct,
      increase,
      decrease,
      remove,
      refresh,
      clear,
    }),
    [
      quote,
      state.restoring,
      state.pending,
      state.loadError,
      state.notice,
      dismissNotice,
      addProduct,
      increase,
      decrease,
      remove,
      refresh,
      clear,
    ]
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
