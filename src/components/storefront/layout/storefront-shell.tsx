import type { ReactNode } from "react"

import { BagNotice } from "@/components/storefront/layout/bag-notice"
import {
  BagPreview,
  type BagPreviewAction,
} from "@/components/storefront/layout/bag-preview"
import { StorefrontNav } from "@/components/storefront/layout/storefront-nav"

type StorefrontShellProps = {
  children: ReactNode
  /** What the bag preview offers; the bag screen asks for "checkout". */
  bagPreviewAction?: BagPreviewAction
}

/**
 * Navigation rail, content, and bag preview. Screens opt in by rendering it, so
 * routes such as checkout do not inherit the rail or the bag.
 *
 * The rail and the bag stay at the edges of the window, as in the design; on a
 * wider window only the content between them stops growing and is centered.
 */
export function StorefrontShell({
  children,
  bagPreviewAction,
}: StorefrontShellProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-4 p-4 md:flex-row md:gap-0">
      <StorefrontNav />
      <main className="min-w-0 flex-1 pb-6 md:ml-6 md:pt-4 lg:pr-6 xl:ml-14 xl:pr-10.5">
        <div className="mx-auto w-full max-w-284">
          <BagNotice />
          {children}
        </div>
      </main>
      <BagPreview action={bagPreviewAction} />
    </div>
  )
}
