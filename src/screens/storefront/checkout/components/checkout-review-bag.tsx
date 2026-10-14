import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { routes } from "@/config/routes"
import { BagLine } from "@/screens/storefront/bag/components/bag-line"
import type { BagLine as BagLineData } from "@/types/storefront/bag.types"
import { cn } from "@/utils/cn"

import styles from "../checkout.module.css"

export function CheckoutReviewBag({ items }: { items: BagLineData[] }) {
  return (
    <section className={styles.reviewPanel} aria-labelledby="review-bag-heading">
      <h2 id="review-bag-heading" className={styles.heading}>Review your bag</h2>
      {items.length > 0 ? (
        <ul className={styles.bagItems}>
          {items.map((item, index) => (
            <li key={item.productId}>
              <BagLine item={item} />
              {index < items.length - 1 && <Separator className={styles.bagDivider} />}
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyBag}>
          <p>Your bag is empty.</p>
          <Link href={routes.shop} className={cn(buttonVariants(), styles.shoppingLink)}>
            Continue shopping
          </Link>
        </div>
      )}
    </section>
  )
}
