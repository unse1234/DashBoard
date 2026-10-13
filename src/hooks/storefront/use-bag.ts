"use client"

import { useContext } from "react"

import { BagContext } from "@/providers/bag-provider"

/** The storefront bag: its items, their total quantity, and how to add a product. */
export function useBag() {
  const bag = useContext(BagContext)
  if (!bag) throw new Error("useBag must be used within a BagProvider")
  return bag
}
