import { AddToBagAction } from "@/screens/storefront/product-details/components/add-to-bag-action"
import type { StorefrontProduct } from "@/types/storefront/product.types"
import { formatStorefrontPrice } from "@/utils/storefront/format-price"

type ProductInfoProps = {
  product: StorefrontProduct
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col @xl:pt-3.25">
      <h1 className="text-4xl leading-tight font-bold wrap-break-word @2xl:text-5xl @3xl:text-[61px] @3xl:leading-16">
        {product.name}
      </h1>
      {/* The design sets the subtitle in the divider grey, lighter than the
          muted text colour of the descriptions. */}
      {product.subtitle && (
        <p className="mt-3 text-2xl leading-8 font-medium text-store-divider @3xl:text-[31px] @3xl:leading-10">
          {product.subtitle}
        </p>
      )}
      <p className="mt-5.75 text-[31px] leading-10 font-medium">
        {formatStorefrontPrice(product.price, product.currency)}
      </p>
      {!product.inStock && (
        <p className="mt-1.75 text-xl leading-7 font-medium text-store-danger">
          Sold out
        </p>
      )}
      <div className="mt-6.5 flex @xl:justify-end">
        <AddToBagAction product={product} />
      </div>
    </div>
  )
}
