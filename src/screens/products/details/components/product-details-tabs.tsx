import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { Product, ProductHistoryEntry } from "@/lib/products/product.types"
import { ProductHistory } from "@/screens/products/details/components/product-history"
import { ProductInformation } from "@/screens/products/details/components/product-information"
import { ProductInventory } from "@/screens/products/details/components/product-inventory"
import { ProductPricing } from "@/screens/products/details/components/product-pricing"

type ProductDetailsTabsProps = {
  product: Product
  history: ProductHistoryEntry[]
}

export function ProductDetailsTabs({
  product,
  history,
}: ProductDetailsTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="@container flex flex-col gap-4">
        <ProductInformation product={product} />
        <div className="grid gap-4 @lg:grid-cols-2">
          <ProductPricing product={product} />
          <ProductInventory product={product} />
        </div>
      </TabsContent>
      <TabsContent value="history">
        <ProductHistory entries={history} />
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Analytics</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Analytics are not available for this product yet.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
