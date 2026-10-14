import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { ShopBackLink } from "@/screens/storefront/product-details/components/shop-back-link"

/** Shown for a product id the catalog does not have: the details screen renders it when the API answers 404. */
export function ProductNotFound() {
  return (
    <StorefrontShell>
      <div className="mx-auto w-full max-w-220 pt-4">
        <ShopBackLink>Back to shop</ShopBackLink>
        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-[32px] leading-10 font-medium">
            Product not found
          </h1>
          <p className="text-xl leading-6 text-store-muted">
            There is no product with this ID. It may have been removed, or the
            link may be incorrect.
          </p>
        </div>
      </div>
    </StorefrontShell>
  )
}
