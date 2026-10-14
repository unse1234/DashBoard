import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { CatalogBrowser } from "@/screens/storefront/catalog/components/catalog-browser"

export function CatalogScreen() {
  return (
    <StorefrontShell>
      <CatalogBrowser />
    </StorefrontShell>
  )
}
