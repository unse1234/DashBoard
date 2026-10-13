import { notFound } from "next/navigation"

import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { ProductGallery } from "@/screens/storefront/product-details/components/product-gallery"
import { ProductInfo } from "@/screens/storefront/product-details/components/product-info"
import { ShopBackLink } from "@/screens/storefront/product-details/components/shop-back-link"
import { getProductDetails } from "@/screens/storefront/product-details/product-details.mocks"

type ProductDetailsScreenProps = {
  productId: string
}

export function ProductDetailsScreen({ productId }: ProductDetailsScreenProps) {
  const details = getProductDetails(productId)
  if (!details) notFound()

  const { product, gallery, description } = details

  return (
    <StorefrontShell>
      {/* Container queries rather than viewport breakpoints: the shell hands this
          column a different width at each step, and the layout follows that. */}
      <div className="@container mx-auto w-full max-w-220 pt-4">
        <ShopBackLink>Back</ShopBackLink>

        <div className="mt-6 flex flex-col gap-6 @xl:flex-row @2xl:gap-8 @3xl:gap-12">
          {/* Keyed so the chosen thumbnail does not carry over to another product. */}
          <ProductGallery key={product.id} images={gallery} />
          <ProductInfo details={details} />
        </div>

        <hr className="mt-9.5 h-0.75 rounded-full border-0 bg-store-divider" />

        <section aria-labelledby="product-description-heading" className="mt-8">
          <h2
            id="product-description-heading"
            className="text-2xl leading-8 font-medium @3xl:text-[31px] @3xl:leading-10"
          >
            Description
          </h2>
          <div className="mt-2 text-base leading-6 text-store-muted @md:text-xl">
            {description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      </div>
    </StorefrontShell>
  )
}
