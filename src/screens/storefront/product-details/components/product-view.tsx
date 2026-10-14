import { ProductGallery } from "@/screens/storefront/product-details/components/product-gallery"
import { ProductInfo } from "@/screens/storefront/product-details/components/product-info"
import type {
  StorefrontProduct,
  StorefrontProductImage,
} from "@/types/storefront/product.types"
import { splitParagraphs } from "@/utils/storefront/product-label"

type ProductViewProps = {
  product: StorefrontProduct
}

/** The loaded product: pictures, the facts beside them, and the description beneath. */
export function ProductView({ product }: ProductViewProps) {
  // The primary picture is the first view; the gallery continues from there.
  const images = [product.image, ...product.gallery].filter(
    (image): image is StorefrontProductImage => image !== null
  )
  const paragraphs = splitParagraphs(product.description)

  return (
    <>
      <div className="mt-6 flex flex-col gap-6 @xl:flex-row @2xl:gap-8 @3xl:gap-12">
        {/* Keyed so the chosen thumbnail does not carry over to another product. */}
        <ProductGallery key={product.id} images={images} />
        <ProductInfo product={product} />
      </div>

      {paragraphs.length > 0 && (
        <>
          <hr className="mt-9.5 h-0.75 rounded-full border-0 bg-store-divider" />

          <section
            aria-labelledby="product-description-heading"
            className="mt-8"
          >
            <h2
              id="product-description-heading"
              className="text-2xl leading-8 font-medium @3xl:text-[31px] @3xl:leading-10"
            >
              Description
            </h2>
            <div className="mt-2 text-base leading-6 text-store-muted @md:text-xl">
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
