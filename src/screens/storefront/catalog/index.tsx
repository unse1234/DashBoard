import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { storefrontProducts } from "@/mocks/storefront/products"
import { CatalogBrowser } from "@/screens/storefront/catalog/components/catalog-browser"

export function CatalogScreen() {
  return (
    <StorefrontShell>
      <CatalogBrowser products={storefrontProducts} />
    </StorefrontShell>
  )
}
