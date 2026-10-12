import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Product } from "@/types/product.types"
import { ProductHistoryTab } from "@/screens/products/details/components/product-history-tab"
import { ProductInformation } from "@/screens/products/details/components/product-information"
import { ProductInventory } from "@/screens/products/details/components/product-inventory"
import { ProductPricing } from "@/screens/products/details/components/product-pricing"

type ProductDetailsTabsProps = {
  product: Product
}

export function ProductDetailsTabs({ product }: ProductDetailsTabsProps) {
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
        <ProductHistoryTab productId={product.id} />
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
